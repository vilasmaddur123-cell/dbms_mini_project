-- ============================================================================
-- PARKWISE — TRIGGERS
-- Run with MySQL CLI:  mysql -u parkwise -p parkwise_db < triggers.sql
--
-- Demonstrates: AFTER INSERT / AFTER UPDATE triggers for audit logging
-- ============================================================================
USE parkwise_db;

DROP TRIGGER IF EXISTS trg_after_booking_insert;
DROP TRIGGER IF EXISTS trg_after_booking_update;

DELIMITER //

-- ============================================================================
-- Trigger 1: Log every new booking creation into booking_history
-- ============================================================================
CREATE TRIGGER trg_after_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
    INSERT INTO booking_history (booking_id, action, old_status, new_status, changed_by, notes)
    VALUES (
        NEW.id,
        'CREATED',
        NULL,
        NEW.status,
        NEW.booked_by,
        CONCAT('Booking created: customer=', NEW.customer_id,
               ', slot=', NEW.slot_id,
               ', charge=', NEW.total_charge)
    );
END //

-- ============================================================================
-- Trigger 2: Log every booking status change into booking_history
-- ============================================================================
CREATE TRIGGER trg_after_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO booking_history (booking_id, action, old_status, new_status, changed_by, notes)
        VALUES (
            NEW.id,
            CASE NEW.status
                WHEN 'CANCELLED'  THEN 'CANCELLED'
                WHEN 'CHECKED_IN' THEN 'CHECKED_IN'
                WHEN 'COMPLETED'  THEN 'COMPLETED'
                ELSE 'STATUS_CHANGED'
            END,
            OLD.status,
            NEW.status,
            NEW.booked_by,
            CASE NEW.status
                WHEN 'CANCELLED' THEN IFNULL(NEW.cancel_reason, 'Booking cancelled')
                ELSE CONCAT('Status changed from ', OLD.status, ' to ', NEW.status)
            END
        );
    END IF;
END //

DELIMITER ;
