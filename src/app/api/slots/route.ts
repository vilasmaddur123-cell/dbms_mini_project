import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get('facilityId');
    const category = searchParams.get('category');
    const floor = searchParams.get('floor');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    let sql = `
      SELECT s.*, f.name AS facility_name
      FROM parking_slots s
      JOIN parking_facilities f ON s.facility_id = f.id
      WHERE s.is_active = TRUE
    `;
    const params: any[] = [];

    if (facilityId) {
      sql += ` AND s.facility_id = ?`;
      params.push(facilityId);
    }

    if (category) {
      sql += ` AND s.category = ?`;
      params.push(category);
    }

    if (floor !== null && floor !== undefined && floor !== '') {
      sql += ` AND s.floor = ?`;
      params.push(parseInt(floor, 10));
    }

    // Interval availability check
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      sql += `
        AND s.id NOT IN (
          SELECT r.slot_id 
          FROM reservations r 
          WHERE r.status IN ('CONFIRMED', 'CHECKED_IN')
            AND r.start_time < ? 
            AND r.end_time > ?
        )
      `;
      params.push(end, start);
    }

    sql += ` ORDER BY s.floor ASC, s.slot_number ASC`;

    const slots = await query<any>(sql, params);
    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      facilityId,
      slotNumber,
      floor,
      category,
      isCovered,
      nearEntrance,
      nearExit,
      nearLift,
      isEvCharging,
      isAccessible,
      distanceToEntranceM,
      distanceToExitM,
      baseHourlyRate,
    } = body;

    const slotId = `s-${crypto.randomUUID().slice(0, 10)}`;

    await query(
      `INSERT INTO parking_slots (
         id, facility_id, slot_number, floor, category,
         is_covered, near_entrance, near_exit, near_lift,
         is_ev_charging, is_accessible, distance_to_entrance_m,
         distance_to_exit_m, base_hourly_rate, status, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', TRUE)`,
      [
        slotId,
        facilityId,
        slotNumber,
        floor || 0,
        category || 'STANDARD',
        isCovered ?? true,
        nearEntrance ?? false,
        nearExit ?? false,
        nearLift ?? false,
        isEvCharging ?? false,
        isAccessible ?? false,
        distanceToEntranceM || 30,
        distanceToExitM || 40,
        baseHourlyRate || 5.0,
      ]
    );

    // Update total_slots count in facility
    await query(
      `UPDATE parking_facilities 
       SET total_slots = (SELECT COUNT(*) FROM parking_slots WHERE facility_id = ? AND is_active = TRUE)
       WHERE id = ?`,
      [facilityId, facilityId]
    );

    return NextResponse.json({ success: true, slotId });
  } catch (err: any) {
    if (err.message === 'FORBIDDEN_ADMIN_REQUIRED') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 });
  }
}
