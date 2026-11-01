import { NextResponse } from 'next/server';
import { searchDestinations } from '@/lib/routing';
import { CAMPUS_CONFIG } from '@/lib/campus-config';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryStr = searchParams.get('q');

    if (!queryStr) {
      return NextResponse.json({ results: [] });
    }

    const { results, outsideCampus } = await searchDestinations(queryStr);

    if (outsideCampus) {
      return NextResponse.json({
        results: [],
        outsideCampus: true,
        message: CAMPUS_CONFIG.outsideCampusMessage,
      });
    }

    return NextResponse.json({ results, outsideCampus: false });
  } catch (error: any) {
    return NextResponse.json({ error: 'Geocoding service error' }, { status: 500 });
  }
}
