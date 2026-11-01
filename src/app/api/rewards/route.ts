import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { getUserPointsBalance, getUserRewardHistory, redeemRewardPoints } from '@/lib/rewards';

export async function GET() {
  try {
    const user = await requireAuth();
    const balance = await getUserPointsBalance(user.id);
    const history = await getUserRewardHistory(user.id);

    return NextResponse.json({
      balance,
      history,
      eligibleDiscounts: [
        { pointsRequired: 50, discountValue: 5.0, label: '$5.00 Parking Credit Voucher' },
        { pointsRequired: 100, discountValue: 12.0, label: '$12.00 Premium Commuter Voucher' },
      ],
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { pointsToRedeem, description } = body;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json({ error: 'Valid points count required' }, { status: 400 });
    }

    const refId = `DISC-VOUCH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const result = await redeemRewardPoints(
      user.id,
      parseInt(pointsToRedeem, 10),
      refId,
      description || `Redeemed ${pointsToRedeem} points for parking voucher`
    );

    return NextResponse.json({
      success: true,
      voucherCode: refId,
      newBalance: result.balanceAfter,
      message: 'Points redeemed successfully! Your voucher is ready.',
    });
  } catch (error: any) {
    if (error.message?.includes('INSUFFICIENT_POINTS')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Redemption failed' }, { status: 500 });
  }
}
