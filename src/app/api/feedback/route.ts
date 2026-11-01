import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { submitFeedback, getFeedbacks, getFeedbackAnalytics, respondToFeedback } from '@/lib/feedback';
import { feedbackSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get('facilityId') || undefined;

    const [feedbacks, analytics] = await Promise.all([
      getFeedbacks(facilityId, 50),
      getFeedbackAnalytics(facilityId),
    ]);

    return NextResponse.json({ feedbacks, analytics });
  } catch (error: any) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback documents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { reservationId, facilityId, rating, category, comment } = parsed.data;

    const result = await submitFeedback({
      userId: user.id,
      userName: user.name,
      reservationId,
      facilityId,
      rating,
      category,
      comment,
    });

    return NextResponse.json({
      success: true,
      message: result.updated ? 'Your review was updated successfully!' : 'Thank you for your feedback!',
      ...result,
    });
  } catch (error: any) {
    if (error.message?.includes('ELIGIBILITY_FAILED')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { feedbackId, responseComment } = body;

    if (!feedbackId || !responseComment) {
      return NextResponse.json({ error: 'feedbackId and responseComment required' }, { status: 400 });
    }

    await respondToFeedback(feedbackId, user.id, responseComment);
    return NextResponse.json({ success: true, message: 'Response posted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update feedback' }, { status: 500 });
  }
}
