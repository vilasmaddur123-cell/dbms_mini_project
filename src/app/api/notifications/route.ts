import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await query<any>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
      [user.id]
    );
    return NextResponse.json({ notifications });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { notificationId } = body;

    if (notificationId) {
      await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [
        notificationId,
        user.id,
      ]);
    } else {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [user.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
