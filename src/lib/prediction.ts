import { query } from './db';

export interface PredictionRequest {
  facilityId: string;
  targetDate: string; // ISO string or YYYY-MM-DD
  targetHour: number; // 0 - 23
  slotCategory?: string;
}

export interface PredictionResult {
  facilityId: string;
  facilityName: string;
  targetDayOfWeek: string;
  targetHour: number;
  estimatedAvailabilityPercentage: number;
  expectedFreeSlots: number;
  totalSlots: number;
  durationUntilAvailableMinutes: number;
  confidenceScore: number; // 0 - 100
  historicalSampleCount: number;
  isSufficientData: boolean;
  explanation: string;
  dataSource: 'DATABASE_HISTORICAL_SESSIONS' | 'INSUFFICIENT_DATA';
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Predicts parking availability for a facility at a specific day/hour using historical reservation patterns
 */
export async function predictAvailability(req: PredictionRequest): Promise<PredictionResult> {
  const target = new Date(req.targetDate);
  const dayOfWeekIndex = target.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayName = DAYS[dayOfWeekIndex];
  const mysqlDayOfWeek = dayOfWeekIndex + 1; // MySQL DAYOFWEEK: 1 = Sun, 7 = Sat

  // Fetch facility metadata
  const facilities = await query<any>(
    'SELECT id, name, total_slots FROM parking_facilities WHERE id = ?',
    [req.facilityId]
  );

  if (facilities.length === 0) {
    throw new Error('Facility not found');
  }

  const facility = facilities[0];
  const totalSlots = facility.total_slots || 1;

  // Aggregate historical reservations matching:
  // 1. Same facility
  // 2. Same day of week (or +/- 1 hour window)
  // 3. Status in COMPLETED, CONFIRMED, CHECKED_IN, NO_SHOW
  const historySql = `
    SELECT 
      COUNT(*) AS total_historical_sessions,
      COUNT(CASE WHEN r.status = 'COMPLETED' THEN 1 END) AS completed_sessions,
      COUNT(CASE WHEN r.status = 'CANCELLED' THEN 1 END) AS cancellations,
      COUNT(CASE WHEN r.status = 'NO_SHOW' THEN 1 END) AS noshows,
      AVG(TIMESTAMPDIFF(MINUTE, r.start_time, r.end_time)) AS avg_session_duration_minutes,
      COUNT(CASE WHEN HOUR(r.start_time) = ? OR HOUR(r.end_time) = ? THEN 1 END) AS matching_hour_sessions
    FROM reservations r
    JOIN parking_slots s ON r.slot_id = s.id
    WHERE s.facility_id = ?
      AND DAYOFWEEK(r.start_time) = ?
  `;

  const stats = await query<any>(historySql, [req.targetHour, req.targetHour, req.facilityId, mysqlDayOfWeek]);
  const stat = stats[0] || {};
  const sampleCount = Number(stat.matching_hour_sessions || 0);

  // Fallback if insufficient historical records
  if (sampleCount < 2) {
    return {
      facilityId: req.facilityId,
      facilityName: facility.name,
      targetDayOfWeek: dayName,
      targetHour: req.targetHour,
      estimatedAvailabilityPercentage: 65,
      expectedFreeSlots: Math.round(totalSlots * 0.65),
      totalSlots,
      durationUntilAvailableMinutes: 15,
      confidenceScore: 30,
      historicalSampleCount: sampleCount,
      isSufficientData: false,
      explanation: 'Insufficient historical data for this specific day/hour combination. Displaying conservative baseline estimate.',
      dataSource: 'INSUFFICIENT_DATA',
    };
  }

  // Calculate historical occupancy pressure
  const avgDuration = Math.round(Number(stat.avg_session_duration_minutes) || 120);
  const cancellationRate = Number(stat.total_historical_sessions) > 0 
    ? Number(stat.cancellations) / Number(stat.total_historical_sessions) 
    : 0;
  const noShowRate = Number(stat.total_historical_sessions) > 0 
    ? Number(stat.noshows) / Number(stat.total_historical_sessions) 
    : 0;

  // Estimated busy slots during target window
  const estimatedOccupiedSlots = Math.min(totalSlots, Math.round(sampleCount * 0.8 * (1 - cancellationRate - noShowRate)));
  const estimatedFree = Math.max(1, totalSlots - estimatedOccupiedSlots);
  const availabilityPercentage = Math.round((estimatedFree / totalSlots) * 100);

  // Confidence is proportional to sample volume
  const confidenceScore = Math.min(95, Math.round(40 + sampleCount * 8));

  // Time until next turnover based on average duration
  const durationUntilAvailableMinutes = Math.min(45, Math.max(5, Math.round((100 - availabilityPercentage) * 0.4)));

  return {
    facilityId: req.facilityId,
    facilityName: facility.name,
    targetDayOfWeek: dayName,
    targetHour: req.targetHour,
    estimatedAvailabilityPercentage: availabilityPercentage,
    expectedFreeSlots: estimatedFree,
    totalSlots,
    durationUntilAvailableMinutes,
    confidenceScore,
    historicalSampleCount: sampleCount,
    isSufficientData: true,
    explanation: `Based on ${sampleCount} historical sessions on ${dayName}s around ${req.targetHour}:00. Historical cancellation rate: ${(cancellationRate * 100).toFixed(1)}%, no-show rate: ${(noShowRate * 100).toFixed(1)}%.`,
    dataSource: 'DATABASE_HISTORICAL_SESSIONS',
  };
}
