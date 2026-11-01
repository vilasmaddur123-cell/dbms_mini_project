import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { awardRewardPoints } from '@/lib/rewards';

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
    if (res.status !== 'CHECKED_IN') {
      return NextResponse.json({ error: `Cannot check out from status ${res.status}` }, { status: 400 });
    }

    // Update reservation to COMPLETED
    await query(
      `UPDATE reservations SET status = 'COMPLETED', updated_at = NOW() WHERE id = ?`,
      [reservationId]
    );

    // Update exit time in entry_exit_records
    await query(
      `UPDATE entry_exit_records 
       SET exit_time = NOW() 
       WHERE reservation_id = ? AND exit_time IS NULL`,
      [reservationId]
    );

    // Award 50 reward points for completed paid session
    await awardRewardPoints(
      res.user_id,
      50,
      'EARNED_BOOKING',
      reservationId,
      `Completed parking reservation ${reservationId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Vehicle checked out successfully! 50 reward points earned.',
      pointsEarned: 50,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Check-out failed' }, { status: 500 });
  }
}
