import crypto from 'crypto';
import { getConnection, query } from './db';

export interface ProcessNoShowResult {
  processedCount: number;
  processedReservationIds: string[];
}

/**
 * Detect and Process Expired Reservations as No-Shows
 */
export async function processNoShows(gracePeriodMinutes: number = 15): Promise<ProcessNoShowResult> {
  const conn = await getConnection();
  const processedIds: string[] = [];

  try {
    await conn.beginTransaction();

    // Find confirmed reservations past grace window with no check-in
    const [expiredRows]: any = await conn.execute(
      `SELECT r.id, r.user_id, r.slot_id, s.slot_number, f.name AS facility_name
       FROM reservations r
       JOIN parking_slots s ON r.slot_id = s.id
       JOIN parking_facilities f ON s.facility_id = f.id
       WHERE r.status = 'CONFIRMED'
         AND NOW() > DATE_ADD(r.start_time, INTERVAL ? MINUTE)
       FOR UPDATE`,
      [gracePeriodMinutes]
    );

    for (const res of expiredRows) {
      // 1. Mark reservation NO_SHOW
      await conn.execute(
        `UPDATE reservations 
         SET status = 'NO_SHOW', updated_at = NOW() 
         WHERE id = ?`,
        [res.id]
      );

      // 2. Insert into no_show_records
      await conn.execute(
        `INSERT INTO no_show_records (
           id, reservation_id, user_id, detected_at, grace_period_minutes, penalty_applied, appeal_status, created_at
         ) VALUES (?, ?, ?, NOW(), ?, TRUE, 'NONE', NOW())
         ON DUPLICATE KEY UPDATE detected_at = NOW()`,
        [`ns-${crypto.randomUUID().slice(0, 10)}`, res.id, res.user_id, gracePeriodMinutes]
      );

      // 3. Insert user warning notification
      await conn.execute(
        `INSERT INTO notifications (
           id, user_id, title, message, type, is_read, created_at
         ) VALUES (?, ?, ?, ?, 'NO_SHOW_WARNING', FALSE, NOW())`,
        [
          `notif-${crypto.randomUUID().slice(0, 8)}`,
          res.user_id,
          'No-Show Penalty Recorded',
          `Your reservation at ${res.facility_name} (Slot ${res.slot_number}) was marked as NO-SHOW after exceeding the ${gracePeriodMinutes}-minute grace period. You can submit an appeal in your dashboard if this was an error.`,
        ]
      );

      processedIds.push(res.id);
    }

    await conn.commit();
    return {
      processedCount: processedIds.length,
      processedReservationIds: processedIds,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Submit an appeal for a no-show record
 */
export async function submitNoShowAppeal(reservationId: string, userId: string, notes: string) {
  const result = await query(
    `UPDATE no_show_records 
     SET appeal_status = 'PENDING', admin_notes = ? 
     WHERE reservation_id = ? AND user_id = ?`,
    [notes, reservationId, userId]
  );
  return { success: true };
}

/**
 * Admin resolve appeal
 */
export async function resolveNoShowAppeal(reservationId: string, approved: boolean, adminNotes: string) {
  const newStatus = approved ? 'APPROVED' : 'REJECTED';
  await query(
    `UPDATE no_show_records 
     SET appeal_status = ?, penalty_applied = ?, admin_notes = ? 
     WHERE reservation_id = ?`,
    [newStatus, !approved, adminNotes, reservationId]
  );
  return { success: true, status: newStatus };
}
