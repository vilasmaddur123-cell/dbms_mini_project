import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { vehicleSchema } from '@/lib/validation';

export async function GET() {
  try {
    const user = await requireAuth();
    const vehicles = await query<any>(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );
    return NextResponse.json({ vehicles });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { licensePlate, make, model, color, isEv } = parsed.data;

    // Check duplicate plate
    const existing = await query<any>(
      'SELECT id FROM vehicles WHERE license_plate = ?',
      [licensePlate.toUpperCase()]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'License plate is already registered' }, { status: 409 });
    }

    const vehicleId = `veh-${crypto.randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO vehicles (id, user_id, license_plate, make, model, color, is_ev, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [vehicleId, user.id, licensePlate.toUpperCase(), make, model, color || null, isEv]
    );

    return NextResponse.json({ success: true, vehicleId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add vehicle' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('id');

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
    }

    await query('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, user.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete vehicle' }, { status: 500 });
  }
}
