import crypto from 'crypto';
import { getConnection } from './db';

export interface CancelReservationParams {
  reservationId: string;
  userId: string;
  isAdmin?: boolean;
}

export interface CancelResult {
  success: boolean;
  reservationId: string;
  cancelled: boolean;
  reallocatedToWaitlistUser?: string | null;
  reallocatedWaitlistEntryId?: string | null;
  message: string;
}

/**
 * Transaction-Safe Reservation Cancellation and Automatic Waiting-List Reallocation
 */
export async function cancelAndReallocate(params: CancelReservationParams): Promise<CancelResult> {
  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // 1. Lock reservation row exclusively and validate state
    const [resRows]: any = await conn.execute(
      `SELECT r.*, s.facility_id, s.slot_number, s.category, f.name AS facility_name
       FROM reservations r
       JOIN parking_slots s ON r.slot_id = s.id
       JOIN parking_facilities f ON s.facility_id = f.id
       WHERE r.id = ? 
       FOR UPDATE`,
      [params.reservationId]
    );

    if (resRows.length === 0) {
      await conn.rollback();
      throw new Error('RESERVATION_NOT_FOUND');
    }

    const res = resRows[0];

    // Enforce authorization
    if (!params.isAdmin && res.user_id !== params.userId) {
      await conn.rollback();
      throw new Error('UNAUTHORIZED_CANCELLATION');
    }

    if (res.status !== 'CONFIRMED') {
      await conn.rollback();
      throw new Error(`CANNOT_CANCEL_STATUS_${res.status}`);
    }

    // 2. Mark reservation CANCELLED
    await conn.execute(
      `UPDATE reservations 
       SET status = 'CANCELLED', updated_at = NOW() 
       WHERE id = ?`,
      [params.reservationId]
    );

    // 3. Search for eligible waiting list candidates
    // Order strictly by: priority_level ASC (e.g. Accessibility=1, VIP=2, General=99), then created_at ASC (FIFO)
    const [candidateRows]: any = await conn.execute(
      `SELECT w.*, u.name AS user_name, u.email
       FROM waiting_list_entries w
       JOIN users u ON w.user_id = u.id
       WHERE w.facility_id = ?
         AND w.status = 'WAITING'
         AND w.expires_at > NOW()
         AND w.start_time >= ?
         AND w.end_time <= ?
       ORDER BY w.priority_level ASC, w.created_at ASC
       FOR UPDATE`,
      [res.facility_id, res.start_time, res.end_time]
    );

    let promotedUserId: string | null = null;
    let promotedEntryId: string | null = null;

    if (candidateRows.length > 0) {
      const topCandidate = candidateRows[0];
      promotedUserId = topCandidate.user_id;
      promotedEntryId = topCandidate.id;

      // Update waiting list status to OFFERED (or direct allocation)
      await conn.execute(
        `UPDATE waiting_list_entries 
         SET status = 'OFFERED', updated_at = NOW() 
         WHERE id = ?`,
        [topCandidate.id]
      );

      // Create high-priority promotion notification
      await conn.execute(
        `INSERT INTO notifications (
           id, user_id, title, message, type, is_read, created_at
         ) VALUES (?, ?, ?, ?, 'WAITLIST_PROMOTED', FALSE, NOW())`,
        [
          `notif-${crypto.randomUUID().slice(0, 8)}`,
          topCandidate.user_id,
          'Slot Available from Waiting List!',
          `A parking spot has opened up at ${res.facility_name} (Slot ${res.slot_number}) for your requested time. Please visit your dashboard to accept.`,
        ]
      );

      // Write allocation event in audit_logs
      await conn.execute(
        `INSERT INTO audit_logs (
           id, entity_name, entity_id, action, performed_by, old_values, new_values, created_at
         ) VALUES (?, 'waiting_list_entries', ?, 'UPDATE', ?, ?, ?, NOW())`,
        [
          crypto.randomUUID(),
          topCandidate.id,
          params.userId,
          JSON.stringify({ status: 'WAITING' }),
          JSON.stringify({
            status: 'OFFERED',
            freedByReservationId: params.reservationId,
            offeredSlotId: res.slot_id,
          }),
        ]
      );
    }

    await conn.commit();

    return {
      success: true,
      reservationId: params.reservationId,
      cancelled: true,
      reallocatedToWaitlistUser: promotedUserId,
      reallocatedWaitlistEntryId: promotedEntryId,
      message: promotedUserId
        ? 'Reservation successfully cancelled and slot reallocated to waiting-list candidate.'
        : 'Reservation successfully cancelled. No waiting list candidates were queued for this slot interval.',
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
