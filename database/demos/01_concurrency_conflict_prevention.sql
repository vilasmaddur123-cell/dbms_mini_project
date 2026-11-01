-- ============================================================================
-- PARKWISE DBMS DEMO 1: CONCURRENCY & BOOKING CONFLICT PREVENTION
-- ============================================================================
-- Objective: Demonstrate transaction isolation and pessimistic row locking
-- to prevent two simultaneous users from booking the same slot for overlapping times.
USE parkwise_db;

-- Scenario:
-- Customer A and Customer B both attempt to book slot 's-pesu-101'
-- Interval: Tomorrow 10:00 AM to 12:00 PM.

-- Transaction 1: Customer A reserves the slot
START TRANSACTION;

-- Step 1: Lock the parking slot row exclusively
SELECT id, slot_number, base_hourly_rate, status 
FROM parking_slots 
WHERE id = 's-pesu-101' 
FOR UPDATE;

-- Step 2: Check for conflicting confirmed/checked-in reservations for the target interval
-- Collision condition: NOT (new_end <= existing_start OR new_start >= existing_end)
SELECT COUNT(*) AS conflict_count
FROM reservations
WHERE slot_id = 's-pesu-101'
  AND status IN ('CONFIRMED', 'CHECKED_IN')
  AND (start_time < (NOW() + INTERVAL 1 DAY + INTERVAL 12 HOUR) 
   AND end_time > (NOW() + INTERVAL 1 DAY + INTERVAL 10 HOUR));

-- Conflict count is 0, so Customer A's booking proceeds:
INSERT INTO reservations (
    id, user_id, slot_id, vehicle_id, start_time, end_time, 
    total_price, applied_hourly_rate, status, idempotency_key, created_at
)
VALUES (
    'demo-res-01', 'usr-cust-01', 's-pesu-101', 'veh-01',
    NOW() + INTERVAL 1 DAY + INTERVAL 10 HOUR,
    NOW() + INTERVAL 1 DAY + INTERVAL 12 HOUR,
    10.00, 5.00, 'CONFIRMED', 'IDEMP-DEMO-001', NOW()
);

-- Commit Transaction 1
COMMIT;

-- Verify Customer A's reservation exists
SELECT id, slot_id, user_id, start_time, end_time, status 
FROM reservations 
WHERE id = 'demo-res-01';


-- Transaction 2: Customer B attempts to book an overlapping interval (11:00 AM to 01:00 PM)
START TRANSACTION;

-- Lock slot row
SELECT id, slot_number, base_hourly_rate, status 
FROM parking_slots 
WHERE id = 's-pesu-101' 
FOR UPDATE;

-- Check for conflict
SELECT COUNT(*) AS conflict_count
FROM reservations
WHERE slot_id = 's-pesu-101'
  AND status IN ('CONFIRMED', 'CHECKED_IN')
  AND (start_time < (NOW() + INTERVAL 1 DAY + INTERVAL 13 HOUR) 
   AND end_time > (NOW() + INTERVAL 1 DAY + INTERVAL 11 HOUR));

-- Conflict count is > 0 (conflict_count = 1), so Customer B is rejected!
-- Application logic detects conflict_count > 0, rolls back, and invites Customer B to join the Waiting List.
ROLLBACK;

-- Clean up demo record
DELETE FROM reservations WHERE id = 'demo-res-01';
