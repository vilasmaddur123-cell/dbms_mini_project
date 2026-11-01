-- ============================================================================
-- PARKWISE — DATABASE VIEWS
-- ============================================================================
USE parkwise_db;

-- ============================================================================
-- VIEW 1: v_available_slots — Available slots with facility details
-- Demonstrates: JOIN, WHERE filtering
-- ============================================================================
DROP VIEW IF EXISTS v_available_slots;
CREATE VIEW v_available_slots AS
SELECT
    s.id            AS slot_id,
    s.slot_number,
    s.floor,
    s.slot_type,
    s.is_covered,
    s.base_hourly_rate,
    s.status,
    f.id            AS facility_id,
    f.name          AS facility_name,
    f.location      AS facility_location,
    f.total_floors
FROM parking_slots s
JOIN parking_facilities f ON s.facility_id = f.id
WHERE s.status = 'AVAILABLE'
  AND s.is_active = TRUE
  AND f.is_active = TRUE;

-- ============================================================================
-- VIEW 2: v_facility_summary — Per-facility occupancy and revenue
-- Demonstrates: LEFT JOIN, GROUP BY, aggregate functions, subquery
-- ============================================================================
DROP VIEW IF EXISTS v_facility_summary;
CREATE VIEW v_facility_summary AS
SELECT
    f.id                    AS facility_id,
    f.name                  AS facility_name,
    f.location,
    f.total_slots,
    COUNT(DISTINCT CASE WHEN s.status = 'AVAILABLE' AND s.is_active = TRUE THEN s.id END) AS available_slots,
    COUNT(DISTINCT CASE WHEN s.status = 'OCCUPIED'  AND s.is_active = TRUE THEN s.id END) AS occupied_slots,
    COUNT(DISTINCT CASE WHEN s.status = 'RESERVED'  AND s.is_active = TRUE THEN s.id END) AS reserved_slots,
    COUNT(DISTINCT CASE WHEN s.status = 'MAINTENANCE' AND s.is_active = TRUE THEN s.id END) AS maintenance_slots,
    COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b.total_charge ELSE 0 END), 0) AS total_revenue,
    COUNT(DISTINCT CASE WHEN b.status IN ('COMPLETED','CHECKED_IN','CONFIRMED') THEN b.id END) AS total_bookings
FROM parking_facilities f
LEFT JOIN parking_slots s ON f.id = s.facility_id
LEFT JOIN bookings b      ON s.id = b.slot_id
WHERE f.is_active = TRUE
GROUP BY f.id, f.name, f.location, f.total_slots;

-- ============================================================================
-- VIEW 3: v_booking_details — Full booking info with JOINs
-- Demonstrates: Multi-table JOIN
-- ============================================================================
DROP VIEW IF EXISTS v_booking_details;
CREATE VIEW v_booking_details AS
SELECT
    b.id              AS booking_id,
    b.start_time,
    b.end_time,
    b.duration_hours,
    b.hourly_rate,
    b.price_multiplier,
    b.total_charge,
    b.status          AS booking_status,
    b.created_at      AS booked_at,
    b.cancelled_at,
    b.cancel_reason,
    c.id              AS customer_id,
    c.name            AS customer_name,
    c.phone           AS customer_phone,
    v.license_plate,
    v.vehicle_type,
    v.make            AS vehicle_make,
    v.model           AS vehicle_model,
    s.slot_number,
    s.floor,
    s.slot_type,
    f.id              AS facility_id,
    f.name            AS facility_name,
    f.location        AS facility_location
FROM bookings b
JOIN customers c         ON b.customer_id = c.id
LEFT JOIN vehicles v     ON b.vehicle_id  = v.id
JOIN parking_slots s     ON b.slot_id     = s.id
JOIN parking_facilities f ON s.facility_id = f.id;
