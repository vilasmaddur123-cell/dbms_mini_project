import { NextResponse } from 'next/server';
import { calculateParkingFee } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slotId, startTime, endTime, discountAmount } = body;

    if (!slotId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'slotId, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    const result = await calculateParkingFee(
      slotId,
      startTime,
      endTime,
      discountAmount ? parseFloat(discountAmount) : 0
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate price' }, { status: 500 });
  }
}
