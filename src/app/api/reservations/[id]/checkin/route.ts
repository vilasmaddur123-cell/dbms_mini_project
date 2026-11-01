import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const reservationId = params.id;

    const rows = await query<any>(
      'SELECT * FROM reservations WHERE id = ? AND (user_id = ? OR ? = TRUE)',
      [reservationId, user.id, user.role === 'ADMIN']
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Reservation not found or unauthorized' }, { status: 404 });
    }

    const res = rows[0];
    if (res.status !== 'CONFIRMED') {
      return NextResponse.json({ error: `Cannot check in from status ${res.status}` }, { status: 400 });
    }

    // Update status to CHECKED_IN
    await query(
      `UPDATE reservations SET status = 'CHECKED_IN', updated_at = NOW() WHERE id = ?`,
      [reservationId]
    );

    // Record entry
    await query(
      `INSERT INTO entry_exit_records (id, reservation_id, entry_time, simulated_by, notes)
       VALUES (?, ?, NOW(), ?, 'Self-service QR check-in')`,
      [`ee-${crypto.randomUUID().slice(0, 10)}`, reservationId, user.id]
    );

    return NextResponse.json({ success: true, message: 'Vehicle checked in successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Check-in failed' }, { status: 500 });
  }
}
