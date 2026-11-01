import { NextResponse } from 'next/server';
import { predictAvailability } from '@/lib/prediction';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { facilityId, targetDate, targetHour, slotCategory } = body;

    if (!facilityId || !targetDate || targetHour === undefined) {
      return NextResponse.json(
        { error: 'facilityId, targetDate, and targetHour (0-23) are required.' },
        { status: 400 }
      );
    }

    const result = await predictAvailability({
      facilityId,
      targetDate,
      targetHour: parseInt(targetHour, 10),
      slotCategory,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Prediction engine error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate availability forecast' }, { status: 500 });
  }
}
