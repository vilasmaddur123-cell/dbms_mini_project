-- ============================================================================
-- PARKWISE — SEED DATA
-- PES University Ring Road Campus (Fictional Sample Data)
-- ============================================================================
USE parkwise_db;

-- ============================================================================
-- 1. ADMIN USER (password: Admin@123)
-- ============================================================================
INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
('usr-admin-01', 'Prof. Arvind Kumar', 'admin@parkwise.com',
 '$2a$10$O0V4V1f3o7K4fT/e/i8vjeC729K3tG5U30wYk.oN48kQ75cO4l9eK',
 'ADMIN', '+91 98450 11223');

-- ============================================================================
-- 2. PARKING FACILITIES
-- ============================================================================
INSERT INTO parking_facilities (id, name, location, total_floors, total_slots, is_active) VALUES
('fac-main',    'Main Building Parking',       'Near Main Gate, PES University RR Campus',            1, 10, TRUE),
('fac-block-b', 'Block B Multi-Level Parking',  'Behind Engineering Block B, PES University RR Campus', 3, 15, TRUE),
('fac-sports',  'Sports Ground Open Parking',   'Near Sports Complex, PES University RR Campus',       1,  8, TRUE);

-- ============================================================================
-- 3. PARKING SLOTS — Main Building (10 ground-floor slots)
-- ============================================================================
INSERT INTO parking_slots (id, facility_id, slot_number, floor, slot_type, is_covered, base_hourly_rate, status) VALUES
('s-main-01', 'fac-main', 'M-01', 0, 'ACCESSIBLE', TRUE,  25.00, 'AVAILABLE'),
('s-main-02', 'fac-main', 'M-02', 0, 'EV',         TRUE,  60.00, 'AVAILABLE'),
('s-main-03', 'fac-main', 'M-03', 0, 'STANDARD',   TRUE,  30.00, 'AVAILABLE'),
('s-main-04', 'fac-main', 'M-04', 0, 'STANDARD',   TRUE,  30.00, 'AVAILABLE'),
('s-main-05', 'fac-main', 'M-05', 0, 'COMPACT',    TRUE,  20.00, 'AVAILABLE'),
('s-main-06', 'fac-main', 'M-06', 0, 'STANDARD',   TRUE,  30.00, 'AVAILABLE'),
('s-main-07', 'fac-main', 'M-07', 0, 'LARGE',      TRUE,  50.00, 'AVAILABLE'),
('s-main-08', 'fac-main', 'M-08', 0, 'STANDARD',   TRUE,  30.00, 'AVAILABLE'),
('s-main-09', 'fac-main', 'M-09', 0, 'EV',         TRUE,  60.00, 'AVAILABLE'),
('s-main-10', 'fac-main', 'M-10', 0, 'STANDARD',   FALSE, 30.00, 'MAINTENANCE');

-- ============================================================================
-- 3b. PARKING SLOTS — Block B Multi-Level (15 slots, 3 floors)
-- ============================================================================
INSERT INTO parking_slots (id, facility_id, slot_number, floor, slot_type, is_covered, base_hourly_rate, status) VALUES
('s-bb-01', 'fac-block-b', 'B0-01', 0, 'ACCESSIBLE', TRUE, 25.00, 'AVAILABLE'),
('s-bb-02', 'fac-block-b', 'B0-02', 0, 'STANDARD',   TRUE, 30.00, 'AVAILABLE'),
('s-bb-03', 'fac-block-b', 'B0-03', 0, 'EV',         TRUE, 60.00, 'AVAILABLE'),
('s-bb-04', 'fac-block-b', 'B0-04', 0, 'LARGE',      TRUE, 50.00, 'AVAILABLE'),
('s-bb-05', 'fac-block-b', 'B0-05', 0, 'STANDARD',   TRUE, 30.00, 'AVAILABLE'),
('s-bb-06', 'fac-block-b', 'B1-01', 1, 'STANDARD',   TRUE, 30.00, 'AVAILABLE'),
('s-bb-07', 'fac-block-b', 'B1-02', 1, 'COMPACT',    TRUE, 20.00, 'AVAILABLE'),
('s-bb-08', 'fac-block-b', 'B1-03', 1, 'STANDARD',   TRUE, 30.00, 'AVAILABLE'),
('s-bb-09', 'fac-block-b', 'B1-04', 1, 'EV',         TRUE, 60.00, 'AVAILABLE'),
('s-bb-10', 'fac-block-b', 'B1-05', 1, 'STANDARD',   TRUE, 30.00, 'AVAILABLE'),
('s-bb-11', 'fac-block-b', 'B2-01', 2, 'STANDARD',   TRUE, 25.00, 'AVAILABLE'),
('s-bb-12', 'fac-block-b', 'B2-02', 2, 'COMPACT',    TRUE, 18.00, 'AVAILABLE'),
('s-bb-13', 'fac-block-b', 'B2-03', 2, 'STANDARD',   TRUE, 25.00, 'AVAILABLE'),
('s-bb-14', 'fac-block-b', 'B2-04', 2, 'STANDARD',   TRUE, 25.00, 'MAINTENANCE'),
('s-bb-15', 'fac-block-b', 'B2-05', 2, 'ACCESSIBLE', TRUE, 22.00, 'AVAILABLE');

-- ============================================================================
-- 3c. PARKING SLOTS — Sports Ground (8 open-air slots)
-- ============================================================================
INSERT INTO parking_slots (id, facility_id, slot_number, floor, slot_type, is_covered, base_hourly_rate, status) VALUES
('s-sp-01', 'fac-sports', 'SP-01', 0, 'STANDARD',   FALSE, 15.00, 'AVAILABLE'),
('s-sp-02', 'fac-sports', 'SP-02', 0, 'STANDARD',   FALSE, 15.00, 'AVAILABLE'),
('s-sp-03', 'fac-sports', 'SP-03', 0, 'COMPACT',    FALSE, 10.00, 'AVAILABLE'),
('s-sp-04', 'fac-sports', 'SP-04', 0, 'LARGE',      FALSE, 25.00, 'AVAILABLE'),
('s-sp-05', 'fac-sports', 'SP-05', 0, 'STANDARD',   FALSE, 15.00, 'AVAILABLE'),
('s-sp-06', 'fac-sports', 'SP-06', 0, 'ACCESSIBLE', FALSE, 12.00, 'AVAILABLE'),
('s-sp-07', 'fac-sports', 'SP-07', 0, 'STANDARD',   FALSE, 15.00, 'AVAILABLE'),
('s-sp-08', 'fac-sports', 'SP-08', 0, 'EV',         FALSE, 40.00, 'AVAILABLE');

-- ============================================================================
-- 4. CUSTOMERS
-- ============================================================================
INSERT INTO customers (id, name, email, phone, id_proof_type, id_proof_number) VALUES
('cust-01', 'Rahul Sharma',   'rahul@email.com',   '+91 9876543210', 'Student ID', 'PES2024CS001'),
('cust-02', 'Priya Patel',    'priya@email.com',   '+91 9876543211', 'Aadhar',     '1234-5678-9012'),
('cust-03', 'Arun Kumar',     'arun@email.com',    '+91 9876543212', 'Driving License', 'KA-DL-2020-001'),
('cust-04', 'Meera Singh',    'meera@email.com',   '+91 9876543213', 'Student ID', 'PES2024EC042'),
('cust-05', 'Vikram Reddy',   'vikram@email.com',  '+91 9876543214', 'Aadhar',     '9876-5432-1098');

-- ============================================================================
-- 5. VEHICLES
-- ============================================================================
INSERT INTO vehicles (id, customer_id, license_plate, vehicle_type, make, model, color) VALUES
('veh-01', 'cust-01', 'KA-01-AB-1234', 'CAR',  'Honda',    'City',        'Silver'),
('veh-02', 'cust-02', 'KA-01-CD-5678', 'SUV',  'Toyota',   'Fortuner',    'White'),
('veh-03', 'cust-03', 'KA-01-EV-9012', 'EV',   'Tata',     'Nexon EV',    'Blue'),
('veh-04', 'cust-04', 'KA-01-GH-3456', 'CAR',  'Hyundai',  'i20',         'Red'),
('veh-05', 'cust-05', 'KA-01-JK-7890', 'BIKE', 'Royal Enfield', 'Classic 350', 'Black');

-- ============================================================================
-- 6. PRICING RULES
-- ============================================================================
INSERT INTO pricing_rules (id, name, rule_type, multiplier, start_time, end_time, days_of_week, is_active) VALUES
('pr-base',    'Standard Base Rate',                'BASE',         1.00, NULL,       NULL,       '1,2,3,4,5,6,7', TRUE),
('pr-peak-am', 'Morning Peak (8 AM – 11 AM)',       'PEAK_MORNING', 1.50, '08:00:00', '11:00:00', '2,3,4,5,6',     TRUE),
('pr-peak-pm', 'Evening Peak (5 PM – 8 PM)',        'PEAK_EVENING', 1.50, '17:00:00', '20:00:00', '2,3,4,5,6',     TRUE),
('pr-weekend', 'Weekend Discount',                  'WEEKEND',      0.80, NULL,       NULL,       '1,7',            TRUE);

-- ============================================================================
-- 7. HISTORICAL BOOKINGS (completed over past 14 days)
-- ============================================================================
INSERT INTO bookings (id, customer_id, vehicle_id, slot_id, start_time, end_time, duration_hours, hourly_rate, price_multiplier, total_charge, status, booked_by, created_at) VALUES
('bk-h01', 'cust-01', 'veh-01', 's-main-03', NOW()-INTERVAL 13 DAY+INTERVAL 9 HOUR,  NOW()-INTERVAL 13 DAY+INTERVAL 12 HOUR, 3.00, 30.00, 1.50, 135.00, 'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 14 DAY),
('bk-h02', 'cust-02', 'veh-02', 's-main-07', NOW()-INTERVAL 12 DAY+INTERVAL 10 HOUR, NOW()-INTERVAL 12 DAY+INTERVAL 14 HOUR, 4.00, 50.00, 1.00, 200.00, 'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 13 DAY),
('bk-h03', 'cust-03', 'veh-03', 's-main-02', NOW()-INTERVAL 11 DAY+INTERVAL 8 HOUR,  NOW()-INTERVAL 11 DAY+INTERVAL 11 HOUR, 3.00, 60.00, 1.50, 270.00, 'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 12 DAY),
('bk-h04', 'cust-04', 'veh-04', 's-bb-02',   NOW()-INTERVAL 10 DAY+INTERVAL 14 HOUR, NOW()-INTERVAL 10 DAY+INTERVAL 17 HOUR, 3.00, 30.00, 1.00, 90.00,  'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 11 DAY),
('bk-h05', 'cust-01', 'veh-01', 's-bb-06',   NOW()-INTERVAL 9  DAY+INTERVAL 9 HOUR,  NOW()-INTERVAL 9  DAY+INTERVAL 13 HOUR, 4.00, 30.00, 1.50, 180.00, 'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 10 DAY),
('bk-h06', 'cust-05', 'veh-05', 's-sp-03',   NOW()-INTERVAL 8  DAY+INTERVAL 11 HOUR, NOW()-INTERVAL 8  DAY+INTERVAL 13 HOUR, 2.00, 10.00, 1.00, 20.00,  'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 9 DAY),
('bk-h07', 'cust-02', 'veh-02', 's-main-07', NOW()-INTERVAL 7  DAY+INTERVAL 17 HOUR, NOW()-INTERVAL 7  DAY+INTERVAL 20 HOUR, 3.00, 50.00, 1.50, 225.00, 'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 8 DAY),
('bk-h08', 'cust-03', 'veh-03', 's-bb-09',   NOW()-INTERVAL 6  DAY+INTERVAL 10 HOUR, NOW()-INTERVAL 6  DAY+INTERVAL 12 HOUR, 2.00, 60.00, 1.50, 180.00, 'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 7 DAY),
('bk-h09', 'cust-01', 'veh-01', 's-sp-01',   NOW()-INTERVAL 5  DAY+INTERVAL 14 HOUR, NOW()-INTERVAL 5  DAY+INTERVAL 16 HOUR, 2.00, 15.00, 1.00, 30.00,  'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 6 DAY),
('bk-h10', 'cust-04', 'veh-04', 's-main-04', NOW()-INTERVAL 3  DAY+INTERVAL 9 HOUR,  NOW()-INTERVAL 3  DAY+INTERVAL 11 HOUR, 2.00, 30.00, 1.50, 90.00,  'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 4 DAY),
('bk-h11', 'cust-02', 'veh-02', 's-bb-04',   NOW()-INTERVAL 2  DAY+INTERVAL 18 HOUR, NOW()-INTERVAL 2  DAY+INTERVAL 21 HOUR, 3.00, 50.00, 1.50, 225.00, 'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 3 DAY),
('bk-h12', 'cust-05', 'veh-05', 's-sp-05',   NOW()-INTERVAL 1  DAY+INTERVAL 10 HOUR, NOW()-INTERVAL 1  DAY+INTERVAL 12 HOUR, 2.00, 15.00, 1.00, 30.00,  'COMPLETED', 'usr-admin-01', NOW()-INTERVAL 2 DAY);

-- Cancelled booking
INSERT INTO bookings (id, customer_id, vehicle_id, slot_id, start_time, end_time, duration_hours, hourly_rate, price_multiplier, total_charge, status, booked_by, cancelled_at, cancel_reason, created_at) VALUES
('bk-can01', 'cust-01', 'veh-01', 's-main-06', NOW()-INTERVAL 4 DAY+INTERVAL 15 HOUR, NOW()-INTERVAL 4 DAY+INTERVAL 18 HOUR, 3.00, 30.00, 1.00, 90.00, 'CANCELLED', 'usr-admin-01', NOW()-INTERVAL 3 DAY, 'Customer requested cancellation', NOW()-INTERVAL 5 DAY);

-- Active bookings (today / upcoming)
INSERT INTO bookings (id, customer_id, vehicle_id, slot_id, start_time, end_time, duration_hours, hourly_rate, price_multiplier, total_charge, status, booked_by, created_at) VALUES
('bk-act01', 'cust-01', 'veh-01', 's-main-03', NOW()-INTERVAL 30 MINUTE, NOW()+INTERVAL 2 HOUR, 2.50, 30.00, 1.00, 75.00, 'CHECKED_IN', 'usr-admin-01', NOW()-INTERVAL 1 HOUR),
('bk-act02', 'cust-04', 'veh-04', 's-bb-06',   NOW()+INTERVAL 1 HOUR,    NOW()+INTERVAL 4 HOUR, 3.00, 30.00, 1.00, 90.00, 'CONFIRMED',  'usr-admin-01', NOW()-INTERVAL 2 HOUR);

-- ============================================================================
-- 8. WAITING LIST
-- ============================================================================
INSERT INTO waiting_list (id, customer_id, facility_id, vehicle_id, preferred_slot_type, start_time, end_time, status) VALUES
('wl-01', 'cust-03', 'fac-main',    'veh-03', 'EV',       NOW()+INTERVAL 2 HOUR, NOW()+INTERVAL 5 HOUR, 'WAITING'),
('wl-02', 'cust-05', 'fac-block-b', 'veh-05', 'STANDARD', NOW()+INTERVAL 3 HOUR, NOW()+INTERVAL 6 HOUR, 'WAITING');
