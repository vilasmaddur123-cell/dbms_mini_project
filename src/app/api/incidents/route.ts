import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { submitIncident, getIncidents, updateIncidentStatus } from '@/lib/feedback';
import { incidentSchema } from '@/lib/validation';

export async function GET() {
  try {
    const incidents = await getIncidents(50);
    return NextResponse.json({ incidents });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = incidentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { facilityId, slotNumber, title, category, severity, description } = parsed.data;

    const result = await submitIncident({
      userId: user.id,
      facilityId,
      slotNumber,
      title,
      category,
      severity,
      description,
    });

    return NextResponse.json({
      success: true,
      message: 'Incident reported successfully. Our facility operations team has been notified.',
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit incident' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { incidentId, status, notes } = body;

    if (!incidentId || !status) {
      return NextResponse.json({ error: 'incidentId and status are required' }, { status: 400 });
    }

    await updateIncidentStatus(incidentId, status, notes);
    return NextResponse.json({ success: true, message: 'Incident status updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update incident' }, { status: 500 });
  }
}
