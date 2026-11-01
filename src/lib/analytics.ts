import { query } from './db';

export async function getCustomerAnalytics(userId: string) {
  // 1. Core Summary Stats
  const userStats = await query<any>(
    `SELECT * FROM v_user_parking_stats WHERE user_id = ?`,
    [userId]
  );
  const summary = userStats[0] || {
    total_reservations: 0,
    completed_reservations: 0,
    cancelled_reservations: 0,
    noshow_reservations: 0,
    total_spent: 0,
    avg_duration_minutes: 0,
    current_reward_balance: 0,
  };

  // 2. Most Frequently Used Facilities
  const frequentFacilities = await query<any>(
    `SELECT 
       f.name AS facility_name,
       COUNT(r.id) AS visit_count,
       SUM(r.total_price) AS total_spent_facility
     FROM reservations r
     JOIN parking_slots s ON r.slot_id = s.id
     JOIN parking_facilities f ON s.facility_id = f.id
     WHERE r.user_id = ? AND r.status = 'COMPLETED'
     GROUP BY f.id, f.name
     ORDER BY visit_count DESC
     LIMIT 5`,
    [userId]
  );

  // 3. Hourly Booking Distribution (Preferred Hours)
  const hourlyTrends = await query<any>(
    `SELECT 
       HOUR(start_time) AS hour,
       COUNT(*) AS booking_count
     FROM reservations
     WHERE user_id = ?
     GROUP BY HOUR(start_time)
     ORDER BY hour ASC`,
    [userId]
  );

  // 4. Day of Week Distribution
  const dayTrends = await query<any>(
    `SELECT 
       DAYNAME(start_time) AS day_name,
       DAYOFWEEK(start_time) AS day_num,
       COUNT(*) AS booking_count
     FROM reservations
     WHERE user_id = ?
     GROUP BY DAYNAME(start_time), DAYOFWEEK(start_time)
     ORDER BY day_num ASC`,
    [userId]
  );

  const total = Number(summary.total_reservations) || 0;
  const cancellations = Number(summary.cancelled_reservations) || 0;
  const noshows = Number(summary.noshow_reservations) || 0;

  return {
    summary: {
      ...summary,
      cancellation_rate_pct: total > 0 ? Math.round((cancellations / total) * 100) : 0,
      noshow_rate_pct: total > 0 ? Math.round((noshows / total) * 100) : 0,
    },
    frequentFacilities,
    hourlyTrends,
    dayTrends,
  };
}

export async function getAdminAnalytics() {
  // 1. Live Occupancy Breakdown across all facilities
  const occupancy = await query<any>(
    `SELECT * FROM v_active_occupancy ORDER BY occupancy_percentage DESC`
  );

  // 2. Revenue and Bookings by Facility
  const facilityRevenue = await query<any>(
    `SELECT * FROM v_facility_revenue_summary ORDER BY total_revenue DESC`
  );

  // 3. System-Wide Aggregated Totals
  const totals = await query<any>(`
    SELECT 
      COUNT(*) AS total_reservations,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_count,
      COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_count,
      COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) AS noshow_count,
      COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_price ELSE 0 END), 0) AS gross_revenue,
      ROUND(AVG(CASE WHEN status = 'COMPLETED' THEN total_price END), 2) AS avg_ticket_size,
      ROUND(AVG(CASE WHEN status = 'COMPLETED' THEN TIMESTAMPDIFF(MINUTE, start_time, end_time) END), 0) AS avg_duration_mins
    FROM reservations
  `);

  // 4. Popular Slot Categories
  const categoryPopularity = await query<any>(`
    SELECT 
      s.category,
      COUNT(r.id) AS booking_volume,
      ROUND(SUM(r.total_price), 2) AS category_revenue
    FROM reservations r
    JOIN parking_slots s ON r.slot_id = s.id
    GROUP BY s.category
    ORDER BY booking_volume DESC
  `);

  // 5. Peak Hours of Day
  const peakHours = await query<any>(`
    SELECT 
      HOUR(start_time) AS hour,
      COUNT(*) AS booking_count,
      ROUND(SUM(total_price), 2) AS total_revenue
    FROM reservations
    WHERE status IN ('COMPLETED', 'CONFIRMED', 'CHECKED_IN')
    GROUP BY HOUR(start_time)
    ORDER BY hour ASC
  `);

  const totalRes = Number(totals[0]?.total_reservations) || 0;
  const totalCancels = Number(totals[0]?.cancelled_count) || 0;
  const totalNoshows = Number(totals[0]?.noshow_count) || 0;

  return {
    overview: {
      ...totals[0],
      cancellation_rate_pct: totalRes > 0 ? ((totalCancels / totalRes) * 100).toFixed(1) : 0,
      noshow_rate_pct: totalRes > 0 ? ((totalNoshows / totalRes) * 100).toFixed(1) : 0,
    },
    occupancy,
    facilityRevenue,
    categoryPopularity,
    peakHours,
  };
}
