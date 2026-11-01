-- ============================================================================
-- PARKWISE — STORED PROCEDURES
-- Run with MySQL CLI:  mysql -u parkwise -p parkwise_db < procedures.sql
-- ============================================================================
USE parkwise_db;

DROP PROCEDURE IF EXISTS sp_calculate_parking_fee;

DELIMITER //

-- ============================================================================
-- sp_calculate_parking_fee
-- Calculates the total parking charge based on slot rate, duration, and
-- applicable pricing rules (peak hours / weekend discount).
--
-- Demonstrates: IN/OUT parameters, DECLARE, SELECT INTO, CASE, date functions
-- ============================================================================
CREATE PROCEDURE sp_calculate_parking_fee(
    IN  p_slot_id        VARCHAR(36),
    IN  p_start_time     DATETIME,
    IN  p_end_time       DATETIME,
    OUT p_hourly_rate    DECIMAL(8,2),
    OUT p_multiplier     DECIMAL(4,2),
    OUT p_duration_hours DECIMAL(5,2),
    OUT p_total_fee      DECIMAL(10,2),
    OUT p_rule_applied   VARCHAR(100)
)
BEGIN
    DECLARE v_base_rate    DECIMAL(8,2);
    DECLARE v_best_mult    DECIMAL(4,2) DEFAULT 1.00;
    DECLARE v_hours        DECIMAL(5,2);
    DECLARE v_dow          INT;       -- DAYOFWEEK: 1=Sun … 7=Sat
    DECLARE v_start_hour   INT;
    DECLARE v_rule_name    VARCHAR(100) DEFAULT 'Standard Base Rate';

    -- 1. Fetch base hourly rate from the slot
    SELECT base_hourly_rate INTO v_base_rate
    FROM parking_slots
    WHERE id = p_slot_id;

    IF v_base_rate IS NULL THEN
        SET v_base_rate = 30.00;
    END IF;

    -- 2. Duration in hours (minimum 0.5 = 30 min)
    SET v_hours = GREATEST(0.50,
                    ROUND(TIMESTAMPDIFF(MINUTE, p_start_time, p_end_time) / 60.0, 2));

    -- 3. Day-of-week and hour for rule matching
    SET v_dow        = DAYOFWEEK(p_start_time);
    SET v_start_hour = HOUR(p_start_time);

    -- 4. Determine the best pricing rule
    --    Weekend discount (Sun=1, Sat=7)
    IF v_dow IN (1, 7) THEN
        SELECT multiplier, name INTO v_best_mult, v_rule_name
        FROM pricing_rules
        WHERE rule_type = 'WEEKEND' AND is_active = TRUE
        LIMIT 1;
    -- Morning peak (Mon–Fri, 8–11)
    ELSEIF v_start_hour >= 8 AND v_start_hour < 11 THEN
        SELECT multiplier, name INTO v_best_mult, v_rule_name
        FROM pricing_rules
        WHERE rule_type = 'PEAK_MORNING' AND is_active = TRUE
        LIMIT 1;
    -- Evening peak (Mon–Fri, 17–20)
    ELSEIF v_start_hour >= 17 AND v_start_hour < 20 THEN
        SELECT multiplier, name INTO v_best_mult, v_rule_name
        FROM pricing_rules
        WHERE rule_type = 'PEAK_EVENING' AND is_active = TRUE
        LIMIT 1;
    END IF;

    IF v_best_mult IS NULL THEN SET v_best_mult = 1.00; END IF;
    IF v_rule_name IS NULL THEN SET v_rule_name = 'Standard Base Rate'; END IF;

    -- 5. Set output parameters
    SET p_hourly_rate    = v_base_rate;
    SET p_multiplier     = v_best_mult;
    SET p_duration_hours = v_hours;
    SET p_total_fee      = ROUND(v_base_rate * v_best_mult * v_hours, 2);
    SET p_rule_applied   = v_rule_name;
END //

DELIMITER ;
