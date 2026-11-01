import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { preferencesSchema } from '@/lib/validation';

export async function GET() {
  try {
    const user = await requireAuth();
    const rows = await query<any>('SELECT * FROM user_preferences WHERE user_id = ?', [user.id]);
    const preferences = rows[0] || null;
    return NextResponse.json({ preferences });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      preferredFloor,
      preferCovered,
      preferNearEntrance,
      preferNearExit,
      preferNearLift,
      requireEv,
      requireAccessible,
      maxHourlyBudget,
      maxWalkingDistanceM,
    } = parsed.data;

    const existing = await query<any>('SELECT id FROM user_preferences WHERE user_id = ?', [user.id]);

    if (existing.length === 0) {
      await query(
        `INSERT INTO user_preferences (
           id, user_id, preferred_floor, prefer_covered,
           prefer_near_entrance, prefer_near_exit, prefer_near_lift,
           require_ev, require_accessible, max_hourly_budget,
           max_walking_distance_m, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          `pref-${crypto.randomUUID().slice(0, 10)}`,
          user.id,
          preferredFloor ?? null,
          preferCovered,
          preferNearEntrance,
          preferNearExit,
          preferNearLift,
          requireEv,
          requireAccessible,
          maxHourlyBudget ?? null,
          maxWalkingDistanceM ?? null,
        ]
      );
    } else {
      await query(
        `UPDATE user_preferences SET
           preferred_floor = ?,
           prefer_covered = ?,
           prefer_near_entrance = ?,
           prefer_near_exit = ?,
           prefer_near_lift = ?,
           require_ev = ?,
           require_accessible = ?,
           max_hourly_budget = ?,
           max_walking_distance_m = ?,
           updated_at = NOW()
         WHERE user_id = ?`,
        [
          preferredFloor ?? null,
          preferCovered,
          preferNearEntrance,
          preferNearExit,
          preferNearLift,
          requireEv,
          requireAccessible,
          maxHourlyBudget ?? null,
          maxWalkingDistanceM ?? null,
          user.id,
        ]
      );
    }

    return NextResponse.json({ success: true, message: 'Preferences updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save preferences' }, { status: 500 });
  }
}
