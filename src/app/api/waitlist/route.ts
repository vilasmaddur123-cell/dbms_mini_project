import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { joinWaitlist, leaveWaitlist, getWaitlistQueuePosition } from '@/lib/waitlist';
import { waitlistSchema } from '@/lib/validation';

export async function GET() {
  try {
    const user = await requireAuth();

    let sql = `
      SELECT 
        w.*,
        f.name AS facility_name,
        f.address AS facility_address
      FROM waiting_list_entries w
      JOIN parking_facilities f ON w.facility_id = f.id
    `;
    const params: any[] = [];

    if (user.role !== 'ADMIN') {
      sql += ` WHERE w.user_id = ?`;
      params.push(user.id);
    }

    sql += ` ORDER BY w.created_at DESC`;

    const entries = await query<any>(sql, params);

    // Enrich active waiting entries with current queue position
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        let queuePosition: number | null = null;
        if (entry.status === 'WAITING') {
          queuePosition = await getWaitlistQueuePosition(entry.id, entry.facility_id);
        }
        return {
          ...entry,
          queuePosition,
        };
      })
    );

    return NextResponse.json({ waitlist: enriched });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { facilityId, desiredCategory, startTime, endTime } = parsed.data;

    const result = await joinWaitlist({
      userId: user.id,
      facilityId,
      desiredCategory,
      startTime,
      endTime,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'DUPLICATE_WAITLIST_REQUEST') {
      return NextResponse.json(
        { error: 'You already have an active waiting list entry for this interval.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to join waitlist' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('id');

    if (!entryId) {
      return NextResponse.json({ error: 'Waitlist entry id is required' }, { status: 400 });
    }

    const result = await leaveWaitlist(entryId, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to leave waitlist' }, { status: 500 });
  }
}
