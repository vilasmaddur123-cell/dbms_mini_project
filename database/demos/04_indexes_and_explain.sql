-- ============================================================================
-- PARKWISE DBMS DEMO 4: INDEXING STRATEGY & QUERY EXECUTION PLANS (EXPLAIN)
-- ============================================================================
-- Objective: Demonstrate performance optimization via B-Tree and composite indexes.
-- Inspect execution plans (EXPLAIN) to verify absence of full-table scans.
USE parkwise_db;

-- 1. Reservation Interval Collision Lookup
-- Index tested: idx_res_slot_time_status (slot_id, start_time, end_time, status)
-- High frequency query executed on EVERY booking attempt.
EXPLAIN 
SELECT id, user_id, start_time, end_time 
FROM reservations 
WHERE slot_id = 's-pesu-101' 
  AND status IN ('CONFIRMED', 'CHECKED_IN')
  AND start_time < '2026-10-15 14:00:00' 
  AND end_time > '2026-10-15 10:00:00';
-- Expected plan: Using index 'idx_res_slot_time_status', type 'ref' or 'range', examining minimal rows.

-- 2. Geographic Facility Radius Filter
-- Index tested: idx_facility_coords (latitude, longitude)
-- Used when customer searches for parking facilities near arbitrary destination coordinates.
EXPLAIN 
SELECT id, name, latitude, longitude,
       (6371 * acos(cos(radians(12.9352)) * cos(radians(latitude)) * 
       cos(radians(longitude) - radians(77.5360)) + sin(radians(12.9352)) * 
       sin(radians(latitude)))) AS distance_km
FROM parking_facilities
WHERE latitude BETWEEN 12.90 AND 12.96 
  AND longitude BETWEEN 77.50 AND 77.56
  AND is_active = TRUE
ORDER BY distance_km ASC;
-- Expected plan: Range scan utilizing idx_facility_coords.

-- 3. Waiting List Queue Allocation Lookup
-- Index tested: idx_wait_queue (facility_id, status, priority_level, created_at)
-- Used by automatic slot reallocation engine upon reservation cancellation.
EXPLAIN 
SELECT id, user_id, priority_level, created_at
FROM waiting_list_entries
WHERE facility_id = 'fac-pesu' 
  AND status = 'WAITING' 
  AND expires_at > NOW()
ORDER BY priority_level ASC, created_at ASC 
LIMIT 1;
-- Expected plan: Uses idx_wait_queue directly, avoiding filesort for (priority_level, created_at).
