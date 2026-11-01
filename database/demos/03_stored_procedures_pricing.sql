-- ============================================================================
-- PARKWISE DBMS DEMO 3: STORED PROCEDURES & DYNAMIC PRICING
-- ============================================================================
-- Objective: Demonstrate server-side business logic encapsulation via
-- MySQL Stored Procedures: Fee Calculation & Automated No-Show Processing.
USE parkwise_db;

-- Part A: Test Stored Procedure sp_calculate_parking_fee
-- Case 1: Standard slot during regular hours (Off-peak, 2 hours duration)
-- Slot: s-pesu-101 (Base Rate $5.00/hr)
CALL sp_calculate_parking_fee(
    's-pesu-101', 
    '2026-10-15 14:00:00', 
    '2026-10-15 16:00:00', 
    @fee1, 
    @rate1, 
    @rule1
);
SELECT @fee1 AS calculated_fee, @rate1 AS applied_rate, @rule1 AS pricing_rule;
-- Expected: 2 hours * $5.00 = $10.00 fee, Rule: Standard Base Off-Peak Rule

-- Case 2: Standard slot during Morning Peak Hours (08:00 - 11:00 AM, 1.35x multiplier)
CALL sp_calculate_parking_fee(
    's-pesu-101', 
    '2026-10-15 09:00:00', 
    '2026-10-15 11:00:00', 
    @fee2, 
    @rate2, 
    @rule2
);
SELECT @fee2 AS calculated_fee, @rate2 AS applied_rate, @rule2 AS pricing_rule;
-- Expected: Rate = 5.00 * 1.35 = 6.75/hr. 2 hours * 6.75 = $13.50 fee.

-- Case 3: EV Fast Charging slot (s-pesu-g02, Base Rate $6.50/hr, EV Multiplier 1.20x)
CALL sp_calculate_parking_fee(
    's-pesu-g02', 
    '2026-10-15 14:00:00', 
    '2026-10-15 16:00:00', 
    @fee3, 
    @rate3, 
    @rule3
);
SELECT @fee3 AS calculated_fee, @rate3 AS applied_rate, @rule3 AS pricing_rule;

-- Case 4: Short stay below minimum charge threshold (15 minutes)
CALL sp_calculate_parking_fee(
    's-pesu-101', 
    '2026-10-15 14:00:00', 
    '2026-10-15 14:15:00', 
    @fee4, 
    @rate4, 
    @rule4
);
SELECT @fee4 AS calculated_fee, @rate4 AS applied_rate, @rule4 AS pricing_rule;
-- Expected: Minimum charge rule enforced (>= $2.00)


-- Part B: Test Automated No-Show Stored Procedure
-- Simulates checking all confirmed reservations where grace period (e.g. 15 mins) has lapsed
CALL sp_detect_and_process_noshows(15, @processed_count);
SELECT @processed_count AS no_shows_processed;
