import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { isInsideCampusBoundary, CAMPUS_CONFIG } from '@/lib/campus-config';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const destLat = searchParams.get('destLat') ? parseFloat(searchParams.get('destLat')!) : null;
    const destLng = searchParams.get('destLng') ? parseFloat(searchParams.get('destLng')!) : null;
    const radiusKm = searchParams.get('radiusKm') ? parseFloat(searchParams.get('radiusKm')!) : 5;

    let sql = `
      SELECT 
        f.*,
        v.currently_occupied,
        v.currently_available,
        v.occupancy_percentage,
        (SELECT MIN(base_hourly_rate) FROM parking_slots WHERE facility_id = f.id AND is_active = TRUE) AS min_hourly_rate,
        (SELECT MAX(base_hourly_rate) FROM parking_slots WHERE facility_id = f.id AND is_active = TRUE) AS max_hourly_rate,
        (SELECT COUNT(*) FROM parking_slots WHERE facility_id = f.id AND is_ev_charging = TRUE) AS ev_slots_count,
        (SELECT COUNT(*) FROM parking_slots WHERE facility_id = f.id AND is_accessible = TRUE) AS accessible_slots_count
      FROM parking_facilities f
      LEFT JOIN v_active_occupancy v ON f.id = v.facility_id
      WHERE f.is_active = TRUE
    `;

    const facilities = await query<any>(sql);

    // If destination coordinates provided, calculate distance and filter by radius
    const enriched = facilities.map((fac) => {
      let distanceKm: number | null = null;
      if (destLat !== null && destLng !== null) {
        const R = 6371; // km
        const dLat = ((Number(fac.latitude) - destLat) * Math.PI) / 180;
        const dLng = ((Number(fac.longitude) - destLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((destLat * Math.PI) / 180) *
            Math.cos((Number(fac.latitude) * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Math.round(R * c * 10) / 10;
      }
      return {
        ...fac,
        distanceKm,
      };
    });

    const filtered = destLat !== null && destLng !== null
      ? enriched.filter((fac) => (fac.distanceKm || 0) <= radiusKm).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
      : enriched;

    return NextResponse.json({ facilities: filtered });
  } catch (error: any) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const { name, address, latitude, longitude, totalFloors } = body;
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required facility fields' }, { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Server-side campus boundary validation
    if (!isInsideCampusBoundary(lat, lng)) {
      return NextResponse.json(
        {
          error: `Facility location (${lat.toFixed(6)}, ${lng.toFixed(6)}) is outside the ${CAMPUS_CONFIG.name} boundary. Only facilities within the campus can be registered.`,
          code: 'OUTSIDE_CAMPUS_BOUNDARY',
        },
        { status: 400 }
      );
    }

    const facilityId = `fac-${crypto.randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO parking_facilities (id, name, address, latitude, longitude, total_floors, total_slots, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, TRUE, NOW())`,
      [facilityId, name, address, lat, lng, totalFloors || 1]
    );

    return NextResponse.json({ success: true, facilityId });
  } catch (err: any) {
    if (err.message === 'FORBIDDEN_ADMIN_REQUIRED') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const { facilityId, name, address, latitude, longitude, totalFloors, isActive } = body;
    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 });
    }

    // If updating coordinates, validate campus boundary
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isInsideCampusBoundary(lat, lng)) {
        return NextResponse.json(
          {
            error: `Updated location (${lat.toFixed(6)}, ${lng.toFixed(6)}) is outside the ${CAMPUS_CONFIG.name} boundary.`,
            code: 'OUTSIDE_CAMPUS_BOUNDARY',
          },
          { status: 400 }
        );
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (address) { updates.push('address = ?'); params.push(address); }
    if (latitude !== undefined) { updates.push('latitude = ?'); params.push(parseFloat(latitude)); }
    if (longitude !== undefined) { updates.push('longitude = ?'); params.push(parseFloat(longitude)); }
    if (totalFloors !== undefined) { updates.push('total_floors = ?'); params.push(totalFloors); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(facilityId);
    await query(`UPDATE parking_facilities SET ${updates.join(', ')} WHERE id = ?`, params);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === 'FORBIDDEN_ADMIN_REQUIRED') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update facility' }, { status: 500 });
  }
}
