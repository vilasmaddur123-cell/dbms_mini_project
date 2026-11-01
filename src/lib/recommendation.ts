import { query } from './db';
import { getMongoDb } from './mongodb';

export interface RecommendationRequest {
  facilityId?: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  userId?: string;
  destinationLat?: number;
  destinationLng?: number;
  maxBudget?: number;
  requireEv?: boolean;
  requireAccessible?: boolean;
}

export interface SlotCandidate {
  id: string;
  facility_id: string;
  facility_name: string;
  latitude: number;
  longitude: number;
  slot_number: string;
  floor: number;
  category: string;
  is_covered: number;
  near_entrance: number;
  near_exit: number;
  near_lift: number;
  is_ev_charging: number;
  is_accessible: number;
  distance_to_entrance_m: number;
  distance_to_exit_m: number;
  base_hourly_rate: number;
  suitability_score?: number;
  score_breakdown?: Record<string, number>;
  reasons?: string[];
  estimated_cost?: number;
  walking_distance_to_dest_m?: number;
}

/**
 * Calculate Great-Circle distance using Haversine formula (in meters)
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Smart Slot Recommendation Engine
 */
export async function getRecommendations(req: RecommendationRequest) {
  const start = new Date(req.startTime);
  const end = new Date(req.endTime);
  const durationHours = Math.max(0.5, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

  // 1. Fetch user preferences if userId is provided
  let userPref: any = null;
  if (req.userId) {
    const prefs = await query<any>('SELECT * FROM user_preferences WHERE user_id = ?', [req.userId]);
    if (prefs.length > 0) userPref = prefs[0];
  }

  const effectiveRequireEv = req.requireEv ?? (userPref?.require_ev === 1);
  const effectiveRequireAccessible = req.requireAccessible ?? (userPref?.require_accessible === 1);
  const effectiveMaxBudget = req.maxBudget ?? (userPref?.max_hourly_budget ? Number(userPref.max_hourly_budget) : null);
  const preferredFloor = userPref?.preferred_floor ?? null;
  const preferCovered = userPref?.prefer_covered === 1;
  const preferNearEntrance = userPref?.prefer_near_entrance === 1;
  const preferNearExit = userPref?.prefer_near_exit === 1;
  const preferNearLift = userPref?.prefer_near_lift === 1;

  // 2. Fetch candidate slots that satisfy HARD CONSTRAINTS
  // Hard Constraint A: Slot is active & Facility is active
  // Hard Constraint B: Slot category matches mandatory EV or Accessible requirement
  // Hard Constraint C: Slot has NO overlapping confirmed or checked-in reservations
  let sql = `
    SELECT 
      s.*, 
      f.name AS facility_name, 
      f.latitude, 
      f.longitude
    FROM parking_slots s
    JOIN parking_facilities f ON s.facility_id = f.id
    WHERE s.is_active = TRUE 
      AND f.is_active = TRUE
      AND s.status != 'MAINTENANCE'
  `;
  const params: any[] = [];

  if (req.facilityId) {
    sql += ` AND s.facility_id = ?`;
    params.push(req.facilityId);
  }

  if (effectiveRequireAccessible) {
    sql += ` AND s.is_accessible = TRUE`;
  }

  if (effectiveRequireEv) {
    sql += ` AND s.is_ev_charging = TRUE`;
  }

  if (effectiveMaxBudget !== null) {
    sql += ` AND s.base_hourly_rate <= ?`;
    params.push(effectiveMaxBudget);
  }

  // Overlap exclusion check:
  sql += `
    AND s.id NOT IN (
      SELECT r.slot_id 
      FROM reservations r
      WHERE r.status IN ('CONFIRMED', 'CHECKED_IN')
        AND r.start_time < ?
        AND r.end_time > ?
    )
  `;
  params.push(end, start);

  const rawCandidates = await query<SlotCandidate>(sql, params);

  if (rawCandidates.length === 0) {
    return {
      recommended: null,
      candidates: [],
      message: 'No available slots satisfy all mandatory criteria for this interval.',
    };
  }

  // 3. Compute Suitability Score (0 to 100) for each candidate
  const scoredCandidates = rawCandidates.map((slot) => {
    let score = 50; // base score
    const breakdown: Record<string, number> = { base: 50 };
    const reasons: string[] = [];

    // Factor 1: Price Suitability (Max 20 pts)
    const rate = Number(slot.base_hourly_rate);
    const estCost = Math.round(rate * durationHours * 100) / 100;
    if (effectiveMaxBudget) {
      const budgetSavingsRatio = Math.max(0, (effectiveMaxBudget - rate) / effectiveMaxBudget);
      const pricePoints = Math.round(budgetSavingsRatio * 20);
      score += pricePoints;
      breakdown.price_economy = pricePoints;
      if (pricePoints > 10) reasons.push(`Exceptional value (${pricePoints} pts under max budget)`);
    } else {
      const pricePoints = Math.max(0, Math.round((10 - Math.min(10, rate)) * 2));
      score += pricePoints;
      breakdown.price_economy = pricePoints;
    }

    // Factor 2: Floor Preference (Max 15 pts)
    if (preferredFloor !== null) {
      if (slot.floor === preferredFloor) {
        score += 15;
        breakdown.floor_match = 15;
        reasons.push(`Directly on preferred floor (Floor ${slot.floor})`);
      } else {
        const floorDiff = Math.abs(slot.floor - preferredFloor);
        const floorPoints = Math.max(0, 15 - floorDiff * 5);
        score += floorPoints;
        breakdown.floor_match = floorPoints;
      }
    } else if (slot.floor === 0 || slot.floor === 1) {
      score += 10;
      breakdown.floor_match = 10;
      reasons.push('Convenient ground or first-floor location');
    }

    // Factor 3: Proximity to Entrance & Lift (Max 15 pts)
    let proximityPoints = 0;
    if (preferNearEntrance && slot.near_entrance) {
      proximityPoints += 8;
      reasons.push('Strategically located next to main entrance');
    } else if (slot.distance_to_entrance_m <= 25) {
      proximityPoints += 5;
    }

    if (preferNearLift && slot.near_lift) {
      proximityPoints += 7;
      reasons.push('Immediate access to elevator lift');
    }
    score += proximityPoints;
    breakdown.proximity_amenities = proximityPoints;

    // Factor 4: Covered Parking Protection (Max 10 pts)
    if (slot.is_covered) {
      score += 10;
      breakdown.weather_covered = 10;
      reasons.push('Weather-protected covered parking bay');
    }

    // Factor 5: Destination Proximity / Walking Distance (Max 20 pts)
    let walkingMeters = 50; // default within parking facility
    if (req.destinationLat && req.destinationLng) {
      const dist = calculateDistanceMeters(
        req.destinationLat,
        req.destinationLng,
        Number(slot.latitude),
        Number(slot.longitude)
      );
      walkingMeters = dist + slot.distance_to_entrance_m;
      // Closer than 300m awards full 20 pts, dropping smoothly up to 1000m
      const distPoints = Math.max(0, Math.min(20, Math.round(20 * (1 - dist / 1200))));
      score += distPoints;
      breakdown.destination_proximity = distPoints;
      if (distPoints >= 15) reasons.push(`Short walking distance to destination (~${walkingMeters}m)`);
    } else {
      breakdown.destination_proximity = 15;
      score += 15;
    }

    // Factor 6: EV Charging / Accessible Features (Max 10 pts)
    if (slot.is_ev_charging) {
      score += 5;
      breakdown.ev_facility = 5;
      reasons.push('Equipped with dedicated EV fast charger');
    }
    if (slot.is_accessible) {
      score += 5;
      breakdown.accessible_bay = 5;
      reasons.push('Wide ADA-compliant accessible bay');
    }

    const normalizedScore = Math.min(100, Math.max(1, score));

    return {
      ...slot,
      suitability_score: normalizedScore,
      score_breakdown: breakdown,
      reasons,
      estimated_cost: estCost,
      walking_distance_to_dest_m: walkingMeters,
    };
  });

  // Sort descending by suitability score
  scoredCandidates.sort((a, b) => (b.suitability_score || 0) - (a.suitability_score || 0));

  const recommended = scoredCandidates[0];
  const alternatives = scoredCandidates.slice(1, 6);

  // Asynchronously snapshot recommendation explanation in MongoDB
  try {
    const mongo = await getMongoDb();
    await mongo.collection('recommendation_logs').insertOne({
      userId: req.userId || 'ANONYMOUS',
      facilityId: req.facilityId,
      requestedStartTime: start,
      requestedEndTime: end,
      recommendedSlotId: recommended.id,
      score: recommended.suitability_score,
      breakdown: recommended.score_breakdown,
      reasons: recommended.reasons,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('Mongo recommendation logging error (non-fatal):', err);
  }

  return {
    recommended,
    alternatives,
    totalAvailable: scoredCandidates.length,
    message: 'Personalized recommendations successfully evaluated.',
  };
}
