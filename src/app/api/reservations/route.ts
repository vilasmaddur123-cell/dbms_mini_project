import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createReservation } from '@/lib/reservations';
import { query } from '@/lib/db';
import { bookingSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        r.*,
        s.slot_number,
        s.floor,
        s.category,
        f.id AS facility_id,
        f.name AS facility_name,
        f.address AS facility_address,
        v.license_plate,
        v.make,
        v.model
      FROM reservations r
      JOIN parking_slots s ON r.slot_id = s.id
      JOIN parking_facilities f ON s.facility_id = f.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
    `;
    const params: any[] = [];

    if (user.role !== 'ADMIN') {
      sql += ` WHERE r.user_id = ?`;
      params.push(user.id);
      if (status) {
        sql += ` AND r.status = ?`;
        params.push(status);
      }
    } else if (status) {
      sql += ` WHERE r.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY r.created_at DESC`;

    const reservations = await query<any>(sql, params);
    return NextResponse.json({ reservations });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to view reservations' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { slotId, startTime, endTime, vehicleId, idempotencyKey } = parsed.data;

    const result = await createReservation({
      userId: user.id,
      slotId,
      vehicleId: vehicleId || null,
      startTime,
      endTime,
      idempotencyKey,
      paymentMethod: body.paymentMethod || 'CARD_SIMULATED',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Reservation booking error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in to book a slot' }, { status: 401 });
    }
    if (error.message === 'BOOKING_CONFLICT_OVERLAPPING_RESERVATION') {
      return NextResponse.json(
        {
          error: 'Slot is already booked for this time interval. Please select another slot or join the waiting list.',
          code: 'BOOKING_CONFLICT',
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to complete booking' }, { status: 500 });
  }
}
