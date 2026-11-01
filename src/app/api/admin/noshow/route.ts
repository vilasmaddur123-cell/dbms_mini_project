import { NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { processNoShows, resolveNoShowAppeal, submitNoShowAppeal } from '@/lib/noshow';

export async function GET() {
  try {
    const user = await requireAuth();

    let sql = `
      SELECT 
        ns.*,
        r.start_time,
        r.end_time,
        r.total_price,
        u.name AS user_name,
        u.email AS user_email,
        s.slot_number,
        f.name AS facility_name
      FROM no_show_records ns
      JOIN reservations r ON ns.reservation_id = r.id
      JOIN users u ON ns.user_id = u.id
      JOIN parking_slots s ON r.slot_id = s.id
      JOIN parking_facilities f ON s.facility_id = f.id
    `;
    const params: any[] = [];

    if (user.role !== 'ADMIN') {
      sql += ` WHERE ns.user_id = ?`;
      params.push(user.id);
    }

    sql += ` ORDER BY ns.detected_at DESC`;

    const records = await query<any>(sql, params);
    return NextResponse.json({ records });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch no-show records' }, { status: 500 });
  }
}

// Admin trigger no-show detection
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const graceMinutes = body.gracePeriodMinutes || 15;

    const result = await processNoShows(graceMinutes);
    return NextResponse.json({
      success: true,
      ...result,
      message: `Processed ${result.processedCount} expired reservations as no-shows with ${graceMinutes}m grace window.`,
    });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_ADMIN_REQUIRED') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to process no-shows' }, { status: 500 });
  }
}

// Appeal resolution
export async function PUT(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { reservationId, action, notes } = body;

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId is required' }, { status: 400 });
    }

    if (action === 'SUBMIT_APPEAL') {
      await submitNoShowAppeal(reservationId, user.id, notes || 'Customer disputed no-show');
      return NextResponse.json({ success: true, message: 'Appeal submitted for review' });
    }

    if (action === 'RESOLVE_APPEAL') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      const approved = Boolean(body.approved);
      const res = await resolveNoShowAppeal(reservationId, approved, notes || 'Admin reviewed appeal');
      return NextResponse.json({ success: true, ...res });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
