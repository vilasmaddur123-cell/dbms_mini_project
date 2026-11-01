import { NextResponse } from 'next/server';
import { getRoute } from '@/lib/routing';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination, mode } = body;

    if (
      !origin || origin.lat === undefined || origin.lng === undefined ||
      !destination || destination.lat === undefined || destination.lng === undefined
    ) {
      return NextResponse.json(
        { error: 'Origin and destination coordinates (lat, lng) are required' },
        { status: 400 }
      );
    }

    const route = await getRoute(origin, destination, mode || 'driving');
    return NextResponse.json(route);
  } catch (error: any) {
    console.error('Routing service error:', error);
    return NextResponse.json({ error: 'Routing calculation failed' }, { status: 500 });
  }
}
