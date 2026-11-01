-- ============================================================================
-- PARKWISE DBMS DEMO 2: DATABASE TRIGGERS & BUSINESS INVARIANTS
-- ============================================================================
-- Objective: Demonstrate automatic audit trail creation on reservation update
-- and enforcing business rule integrity via BEFORE INSERT trigger.
USE parkwise_db;

-- Part A: Test Audit Trigger on Status Transition
-- Let's inspect current audit log count
SELECT COUNT(*) AS initial_audit_count FROM audit_logs WHERE entity_name = 'reservations';

-- Create a temporary test reservation
INSERT INTO reservations (
    id, user_id, slot_id, vehicle_id, start_time, end_time, 
    total_price, applied_hourly_rate, status, created_at
)
VALUES (
    'audit-test-res-01', 'usr-cust-01', 's-pesu-101', 'veh-01',
    NOW() + INTERVAL 2 DAY, NOW() + INTERVAL 2 DAY + INTERVAL 2 HOUR,
    10.00, 5.00, 'CONFIRMED', NOW()
);

-- Update reservation status from CONFIRMED to CANCELLED
UPDATE reservations 
SET status = 'CANCELLED' 
WHERE id = 'audit-test-res-01';

-- Verify the trigger automatically logged the state transition in audit_logs:
SELECT entity_name, entity_id, action, performed_by, old_values, new_values, created_at
FROM audit_logs
WHERE entity_id = 'audit-test-res-01'
ORDER BY created_at DESC;

-- Clean up
DELETE FROM reservations WHERE id = 'audit-test-res-01';


-- Part B: Test Business Invariant Trigger on Negative Reward Points
-- Rule: A user's points balance must never drop below 0.
-- Let's attempt to insert an illegal ledger entry with negative balance_after:
-- Expected result: Trigger raises SIGNAL SQLSTATE '45000' and rejects the insert!

-- Test case 1: Valid reward deduction (Points drop from 150 to 50) - SHOULD SUCCEED
INSERT INTO reward_ledgers (id, user_id, points, type, reference_id, balance_after, description, created_at)
VALUES ('rew-test-valid', 'usr-cust-01', -100, 'REDEEMED_DISCOUNT', 'REF-TEST-001', 50, 'Valid discount redemption', NOW());

SELECT * FROM reward_ledgers WHERE id = 'rew-test-valid';
DELETE FROM reward_ledgers WHERE id = 'rew-test-valid';

-- Test case 2: Invalid reward deduction resulting in negative balance (-50) - MUST FAIL!
-- UNCOMMENT TO OBSERVE ERROR:
-- INSERT INTO reward_ledgers (id, user_id, points, type, reference_id, balance_after, description, created_at)
-- VALUES ('rew-test-fail', 'usr-cust-01', -250, 'REDEEMED_DISCOUNT', 'REF-TEST-002', -50, 'Invalid redemption exceeding balance', NOW());
-- Error Code: 1644. Integrity constraint violated: Reward points balance cannot drop below zero.
