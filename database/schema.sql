-- ============================================================================
-- PARKWISE — PARKING MANAGEMENT SYSTEM DATABASE SCHEMA
-- PES University Ring Road Campus (Sample/Fictional Data for DBMS Mini-Project)
-- MySQL 8.0
-- ============================================================================

CREATE DATABASE IF NOT EXISTS parkwise_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE parkwise_db;

-- Drop tables in reverse dependency order for clean rebuild
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS booking_history;
DROP TABLE IF EXISTS waiting_list;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS pricing_rules;
DROP TABLE IF EXISTS parking_slots;
DROP TABLE IF EXISTS parking_facilities;
DROP TABLE IF EXISTS users;
-- Drop legacy tables from previous schema version
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS payment_records;
DROP TABLE IF EXISTS entry_exit_records;
DROP TABLE IF EXISTS no_show_records;
DROP TABLE IF EXISTS waiting_list_entries;
DROP TABLE IF EXISTS reward_ledgers;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS priority_eligibilities;
DROP TABLE IF EXISTS user_preferences;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLE 1: users — Management/Admin login accounts
-- ============================================================================
CREATE TABLE users (
    id          VARCHAR(36)   PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(191)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
    phone       VARCHAR(20),
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_email UNIQUE (email),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 2: parking_facilities
-- ============================================================================
CREATE TABLE parking_facilities (
    id          VARCHAR(36)   PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    location    VARCHAR(255)  NOT NULL,
    total_floors INT          NOT NULL DEFAULT 1,
    total_slots  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_floors CHECK (total_floors >= 1),
    CONSTRAINT chk_slots  CHECK (total_slots >= 0),
    INDEX idx_facility_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 3: parking_slots
-- ============================================================================
CREATE TABLE parking_slots (
    id              VARCHAR(36)    PRIMARY KEY,
    facility_id     VARCHAR(36)    NOT NULL,
    slot_number     VARCHAR(20)    NOT NULL,
    floor           INT            NOT NULL DEFAULT 0,
    slot_type       ENUM('STANDARD','COMPACT','LARGE','EV','ACCESSIBLE') NOT NULL DEFAULT 'STANDARD',
    is_covered      BOOLEAN        NOT NULL DEFAULT FALSE,
    base_hourly_rate DECIMAL(8,2)  NOT NULL DEFAULT 30.00,
    status          ENUM('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_slot_facility FOREIGN KEY (facility_id) REFERENCES parking_facilities(id) ON DELETE CASCADE,
    CONSTRAINT uq_facility_slot UNIQUE (facility_id, slot_number),
    CONSTRAINT chk_rate CHECK (base_hourly_rate > 0),
    INDEX idx_slot_status (facility_id, status, is_active),
    INDEX idx_slot_type (slot_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 4: customers — Registered by management
-- ============================================================================
CREATE TABLE customers (
    id              VARCHAR(36)   PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(191),
    phone           VARCHAR(20)   NOT NULL,
    id_proof_type   VARCHAR(50),
    id_proof_number VARCHAR(50),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_email UNIQUE (email),
    INDEX idx_customer_phone (phone),
    INDEX idx_customer_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 5: vehicles — Linked to customers
-- ============================================================================
CREATE TABLE vehicles (
    id            VARCHAR(36)  PRIMARY KEY,
    customer_id   VARCHAR(36)  NOT NULL,
    license_plate VARCHAR(30)  NOT NULL,
    vehicle_type  ENUM('CAR','BIKE','SUV','EV','TRUCK') NOT NULL DEFAULT 'CAR',
    make          VARCHAR(50),
    model         VARCHAR(50),
    color         VARCHAR(30),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT uq_license UNIQUE (license_plate),
    INDEX idx_vehicle_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 6: pricing_rules — Peak / off-peak multipliers
-- ============================================================================
CREATE TABLE pricing_rules (
    id           VARCHAR(36)   PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    rule_type    ENUM('BASE','PEAK_MORNING','PEAK_EVENING','WEEKEND') NOT NULL DEFAULT 'BASE',
    multiplier   DECIMAL(4,2)  NOT NULL DEFAULT 1.00,
    start_time   TIME,
    end_time     TIME,
    days_of_week VARCHAR(30),
    is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_multiplier CHECK (multiplier > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 7: bookings — Core booking table with concurrency locking
-- ============================================================================
CREATE TABLE bookings (
    id               VARCHAR(36)   PRIMARY KEY,
    customer_id      VARCHAR(36)   NOT NULL,
    vehicle_id       VARCHAR(36),
    slot_id          VARCHAR(36)   NOT NULL,
    start_time       DATETIME      NOT NULL,
    end_time         DATETIME      NOT NULL,
    duration_hours   DECIMAL(5,2)  NOT NULL,
    hourly_rate      DECIMAL(8,2)  NOT NULL,
    price_multiplier DECIMAL(4,2)  NOT NULL DEFAULT 1.00,
    total_charge     DECIMAL(10,2) NOT NULL,
    status           ENUM('CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    booked_by        VARCHAR(36),
    cancelled_at     DATETIME,
    cancel_reason    VARCHAR(255),
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_booking_vehicle  FOREIGN KEY (vehicle_id)  REFERENCES vehicles(id) ON DELETE SET NULL,
    CONSTRAINT fk_booking_slot     FOREIGN KEY (slot_id)     REFERENCES parking_slots(id),
    CONSTRAINT fk_booking_admin    FOREIGN KEY (booked_by)   REFERENCES users(id),
    CONSTRAINT chk_booking_time    CHECK (start_time < end_time),
    CONSTRAINT chk_duration        CHECK (duration_hours > 0),
    CONSTRAINT chk_charge          CHECK (total_charge >= 0),
    INDEX idx_booking_slot_time  (slot_id, start_time, end_time, status),
    INDEX idx_booking_customer   (customer_id, status),
    INDEX idx_booking_status     (status),
    INDEX idx_booking_time       (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 8: booking_history — Audit trail populated by trigger
-- ============================================================================
CREATE TABLE booking_history (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    booking_id  VARCHAR(36)   NOT NULL,
    action      VARCHAR(50)   NOT NULL,
    old_status  VARCHAR(20),
    new_status  VARCHAR(20)   NOT NULL,
    changed_by  VARCHAR(36),
    notes       TEXT,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_history_booking (booking_id),
    INDEX idx_history_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 9: waiting_list — FIFO queue for slot availability
-- ============================================================================
CREATE TABLE waiting_list (
    id                VARCHAR(36)  PRIMARY KEY,
    customer_id       VARCHAR(36)  NOT NULL,
    facility_id       VARCHAR(36)  NOT NULL,
    vehicle_id        VARCHAR(36),
    preferred_slot_type VARCHAR(30),
    start_time        DATETIME     NOT NULL,
    end_time          DATETIME     NOT NULL,
    status            ENUM('WAITING','OFFERED','FULFILLED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'WAITING',
    offered_slot_id   VARCHAR(36),
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wl_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_wl_facility FOREIGN KEY (facility_id) REFERENCES parking_facilities(id),
    CONSTRAINT fk_wl_vehicle  FOREIGN KEY (vehicle_id)  REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_wl_facility_status (facility_id, status, created_at),
    INDEX idx_wl_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
