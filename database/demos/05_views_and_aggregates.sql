-- ============================================================================
-- PARKWISE DBMS DEMO 5: VIEWS, AGGREGATION & ADVANCED ANALYTICAL SQL
-- ============================================================================
-- Objective: Demonstrate SQL views, multi-table joins, subqueries,
-- GROUP BY, HAVING, and date-based aggregation for behavioral analytics.
USE parkwise_db;

-- 1. Real-Time Occupancy View
SELECT 
    facility_name, 
    total_slots, 
    currently_occupied, 
    currently_available, 
    occupancy_percentage 
FROM v_active_occupancy
ORDER BY occupancy_percentage DESC;

-- 2. Facility Revenue & Efficiency Analysis
SELECT 
    facility_name, 
    total_bookings, 
    completed_bookings, 
    cancelled_bookings, 
    noshow_bookings, 
    total_revenue, 
    avg_booking_value,
    avg_duration_minutes
FROM v_facility_revenue_summary
WHERE total_bookings > 0
ORDER BY total_revenue DESC;

-- 3. Customer Parking Behavior Metrics
SELECT 
    name, 
    email, 
    total_reservations, 
    completed_reservations, 
    total_spent, 
    avg_duration_minutes, 
    current_reward_balance
FROM v_user_parking_stats
ORDER BY total_spent DESC;

-- 4. Peak Demand by Hour of Day (SQL Subquery & Aggregation)
SELECT 
    HOUR(start_time) AS hour_of_day,
    COUNT(*) AS total_bookings,
    ROUND(AVG(total_price), 2) AS avg_revenue
FROM reservations
WHERE status IN ('COMPLETED', 'CONFIRMED', 'CHECKED_IN')
GROUP BY HOUR(start_time)
HAVING COUNT(*) >= 1
ORDER BY total_bookings DESC;

-- 5. Cancellation Rate per Facility (Subquery with conditional aggregation)
SELECT 
    f.name AS facility_name,
    COUNT(r.id) AS total_reservations,
    SUM(CASE WHEN r.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancellations,
    ROUND((SUM(CASE WHEN r.status = 'CANCELLED' THEN 1 ELSE 0 END) / COUNT(r.id)) * 100, 2) AS cancellation_rate_pct
FROM parking_facilities f
JOIN parking_slots s ON f.id = s.facility_id
JOIN reservations r ON s.id = r.slot_id
GROUP BY f.id, f.name
ORDER BY cancellation_rate_pct DESC;
