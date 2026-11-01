import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCustomerAnalytics, getAdminAnalytics } from '@/lib/analytics';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');

    if (user.role === 'ADMIN' && scope === 'admin') {
      const data = await getAdminAnalytics();
      return NextResponse.json({ role: 'ADMIN', data });
    }

    const data = await getCustomerAnalytics(user.id);
    return NextResponse.json({ role: 'CUSTOMER', data });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}
