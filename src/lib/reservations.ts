import crypto from 'crypto';
import { getConnection, query } from './db';
import { calculateParkingFee } from './pricing';

export interface CreateBookingParams {
  userId: string;
  slotId: string;
  vehicleId?: string | null;
  startTime: string; // ISO
  endTime: string;   // ISO
  idempotencyKey?: string;
  paymentMethod?: 'CARD_SIMULATED' | 'REWARDS_CREDIT' | 'WALLET_SIMULATED';
}

/**
 * Concurrency-Safe Transactional Reservation Creation
 * Uses MySQL pessimistic row locking (SELECT ... FOR UPDATE) inside an ACID transaction
 */
export async function createReservation(params: CreateBookingParams) {
  const start = new Date(params.startTime);
  const end = new Date(params.endTime);

  if (start >= end) {
    throw new Error('Invalid interval: Start time must precede end time.');
  }

  // Idempotency check: If an idempotency key was sent and already exists, return existing booking
  if (params.idempotencyKey) {
    const existing = await query<any>(
      'SELECT * FROM reservations WHERE idempotency_key = ?',
      [params.idempotencyKey]
    );
    if (existing.length > 0) {
      return {
        success: true,
        reservation: existing[0],
        isIdempotentReplay: true,
      };
    }
  }

  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // 1. Pessimistically lock the slot row to prevent concurrent race conditions
    const [slotRows]: any = await conn.execute(
      `SELECT s.*, f.id AS facility_id, f.name AS facility_name, f.is_active AS facility_active
       FROM parking_slots s
       JOIN parking_facilities f ON s.facility_id = f.id
       WHERE s.id = ? 
       FOR UPDATE`,
      [params.slotId]
    );

    if (slotRows.length === 0) {
      await conn.rollback();
      throw new Error('SLOT_NOT_FOUND');
    }

    const slot = slotRows[0];

    if (!slot.is_active || !slot.facility_active || slot.status === 'MAINTENANCE') {
      await conn.rollback();
      throw new Error('SLOT_NOT_BOOKABLE');
    }

    // 2. Concurrency Conflict Check: Ensure no overlapping CONFIRMED or CHECKED_IN reservation exists
    // Collision condition: (start < existing_end) AND (end > existing_start)
    const [overlapRows]: any = await conn.execute(
      `SELECT id, user_id, start_time, end_time, status 
       FROM reservations
       WHERE slot_id = ?
         AND status IN ('CONFIRMED', 'CHECKED_IN')
         AND (start_time < ? AND end_time > ?)
       FOR UPDATE`,
      [params.slotId, end, start]
    );

    if (overlapRows.length > 0) {
      await conn.rollback();
      throw new Error('BOOKING_CONFLICT_OVERLAPPING_RESERVATION');
    }

    // 3. Calculate authoritative pricing on server
    const pricing = await calculateParkingFee(params.slotId, start, end);
    const reservationId = `res-${crypto.randomUUID().slice(0, 12)}`;
    const idempotencyKey = params.idempotencyKey || `idemp-${crypto.randomUUID()}`;

    // 4. Insert Reservation
    await conn.execute(
      `INSERT INTO reservations (
         id, user_id, slot_id, vehicle_id, start_time, end_time,
         total_price, applied_hourly_rate, pricing_breakdown,
         status, idempotency_key, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, NOW())`,
      [
        reservationId,
        params.userId,
        params.slotId,
        params.vehicleId || null,
        start,
        end,
        pricing.totalFee,
        pricing.hourlyRate,
        JSON.stringify(pricing.breakdown),
        idempotencyKey,
      ]
    );

    // 5. Insert Simulated Payment Record
    const paymentId = `pay-${crypto.randomUUID().slice(0, 12)}`;
    const txnRef = `SIM-TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await conn.execute(
      `INSERT INTO payment_records (
         id, reservation_id, user_id, amount, payment_method, status, transaction_reference, created_at
       ) VALUES (?, ?, ?, ?, ?, 'SUCCEEDED', ?, NOW())`,
      [
        paymentId,
        reservationId,
        params.userId,
        pricing.totalFee,
        params.paymentMethod || 'CARD_SIMULATED',
        txnRef,
      ]
    );

    // 6. Send User Notification
    await conn.execute(
      `INSERT INTO notifications (
         id, user_id, title, message, type, is_read, created_at
       ) VALUES (?, ?, ?, ?, 'BOOKING', FALSE, NOW())`,
      [
        `notif-${crypto.randomUUID().slice(0, 8)}`,
        params.userId,
        'Reservation Confirmed!',
        `Your parking reservation at ${slot.facility_name} (Slot ${slot.slot_number}) has been confirmed for $${pricing.totalFee.toFixed(2)}.`,
      ]
    );

    // Commit Transaction atomically
    await conn.commit();

    return {
      success: true,
      reservationId,
      totalFee: pricing.totalFee,
      slotNumber: slot.slot_number,
      facilityName: slot.facility_name,
      transactionReference: txnRef,
      pricingBreakdown: pricing.breakdown,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
