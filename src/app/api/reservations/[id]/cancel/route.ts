import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { cancelAndReallocate } from '@/lib/reallocation';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const reservationId = params.id;

    const result = await cancelAndReallocate({
      reservationId,
      userId: user.id,
      isAdmin: user.role === 'ADMIN',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Cancellation error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    if (error.message === 'UNAUTHORIZED_CANCELLATION') {
      return NextResponse.json({ error: 'You do not own this reservation' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to cancel reservation' }, { status: 500 });
  }
}
