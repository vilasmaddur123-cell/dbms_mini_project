import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRecommendations } from '@/lib/recommendation';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      facilityId,
      startTime,
      endTime,
      destinationLat,
      destinationLng,
      maxBudget,
      requireEv,
      requireAccessible,
    } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'startTime and endTime are required ISO timestamp strings.' },
        { status: 400 }
      );
    }

    const result = await getRecommendations({
      facilityId: facilityId || undefined,
      startTime,
      endTime,
      userId: user?.id,
      destinationLat: destinationLat ? parseFloat(destinationLat) : undefined,
      destinationLng: destinationLng ? parseFloat(destinationLng) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
      requireEv: Boolean(requireEv),
      requireAccessible: Boolean(requireAccessible),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Recommendation engine error:', error);
    return NextResponse.json({ error: error.message || 'Failed to compute recommendations' }, { status: 500 });
  }
}
