import { query, getConnection } from './db';

export interface PricingCalculationResult {
  totalFee: number;
  hourlyRate: number;
  durationHours: number;
  ruleApplied: string;
  breakdown: {
    baseHourlyRate: number;
    multiplier: number;
    peakMultiplierName?: string;
    durationMinutes: number;
    subtotal: number;
    minimumChargeApplied: boolean;
    discountDeduction: number;
  };
}

/**
 * Calculates pricing for a slot interval using MySQL stored procedure with application logic fallback
 */
export async function calculateParkingFee(
    slotId: string,
    startTime: string | Date,
    endTime: string | Date,
    discountAmount: number = 0
): Promise<PricingCalculationResult> {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw new Error('Start time must be strictly before end time.');
  }

  const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
  const durationHours = Math.round((durationMinutes / 60) * 100) / 100;

  // Attempt Stored Procedure Execution
  try {
    const conn = await getConnection();
    try {
      const mysqlStart = start.toISOString().slice(0, 19).replace('T', ' ');
      const mysqlEnd = end.toISOString().slice(0, 19).replace('T', ' ');

      await conn.query(
        'CALL sp_calculate_parking_fee(?, ?, ?, @p_total_fee, @p_hourly_rate, @p_rule_applied)',
        [slotId, mysqlStart, mysqlEnd]
      );
      const [outputRows]: any = await conn.query(
        'SELECT @p_total_fee AS total_fee, @p_hourly_rate AS hourly_rate, @p_rule_applied AS rule_applied'
      );
      const res = outputRows[0];
      const rawTotal = Number(res.total_fee);
      const hourlyRate = Number(res.hourly_rate);
      const finalTotal = Math.max(0, Math.round((rawTotal - discountAmount) * 100) / 100);

      return {
        totalFee: finalTotal,
        hourlyRate,
        durationHours,
        ruleApplied: res.rule_applied || 'MySQL Stored Procedure sp_calculate_parking_fee',
        breakdown: {
          baseHourlyRate: hourlyRate,
          multiplier: 1.0,
          peakMultiplierName: res.rule_applied,
          durationMinutes,
          subtotal: rawTotal,
          minimumChargeApplied: rawTotal <= 2.0,
          discountDeduction: discountAmount,
        },
      };
    } finally {
      conn.release();
    }
  } catch (spErr) {
    // Graceful fallback to SQL-backed application rules
    console.warn('SP fee calculation fallback to application logic:', spErr);

    const slotRows = await query<any>(
      `SELECT s.*, f.id as facility_id 
       FROM parking_slots s 
       JOIN parking_facilities f ON s.facility_id = f.id 
       WHERE s.id = ?`,
      [slotId]
    );

    if (slotRows.length === 0) {
      throw new Error('Parking slot not found');
    }

    const slot = slotRows[0];
    const baseRate = Number(slot.base_hourly_rate);

    // Determine matching active pricing rule
    const rules = await query<any>(
      `SELECT * FROM pricing_rules 
       WHERE is_active = TRUE 
         AND (facility_id = ? OR facility_id IS NULL)
         AND (slot_category = ? OR slot_category IS NULL)
       ORDER BY multiplier DESC`,
      [slot.facility_id, slot.category]
    );

    let multiplier = 1.0;
    let ruleName = 'Standard Base Rate';
    let minCharge = 2.0;

    if (rules.length > 0) {
      const topRule = rules[0];
      multiplier = Number(topRule.multiplier);
      ruleName = topRule.name;
      minCharge = Number(topRule.minimum_charge);
    }

    const effectiveHourlyRate = Math.round(baseRate * multiplier * 100) / 100;
    let subtotal = Math.round(effectiveHourlyRate * durationHours * 100) / 100;
    let minApplied = false;

    if (subtotal < minCharge) {
      subtotal = minCharge;
      minApplied = true;
    }

    const finalFee = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    return {
      totalFee: finalFee,
      hourlyRate: effectiveHourlyRate,
      durationHours,
      ruleApplied: ruleName,
      breakdown: {
        baseHourlyRate: baseRate,
        multiplier,
        peakMultiplierName: ruleName,
        durationMinutes,
        subtotal,
        minimumChargeApplied: minApplied,
        discountDeduction: discountAmount,
      },
    };
  }
}
