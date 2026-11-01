# 4. ADVANCED SQL FEATURES & DBMS DEMONSTRATIONS

## 4.1 Concept 1: Transaction Isolation & Concurrency Conflict Prevention
- **Implementation File:** `database/demos/01_concurrency_conflict_prevention.sql` & `src/lib/reservations.ts`
- **Theory:** In a high-traffic reservation platform, two concurrent booking requests must never confirm the same slot for overlapping time intervals. ParkWise avoids naive `SELECT ... INSERT` race conditions by opening an explicit transaction and applying an exclusive row lock on the target slot via `SELECT ... FOR UPDATE`.
- **Interval Collision Condition:**
  $$\neg (\text{new\_end} \le \text{existing\_start} \lor \text{new\_start} \ge \text{existing\_end})$$
  Expressed as:
  ```sql
  WHERE slot_id = ?
    AND status IN ('CONFIRMED', 'CHECKED_IN')
    AND start_time < :new_end 
    AND end_time > :new_start
  FOR UPDATE;
  ```
  If count > 0, the transaction immediately rolls back and alerts the customer to select another slot or queue in the Waiting List.

## 4.2 Concept 2: Database Triggers & Business Rule Invariants
- **Implementation File:** `database/triggers.sql` & `database/demos/02_triggers_audit_ledger.sql`
- **Audit Trigger (`trg_after_reservation_update_audit`):**
  Fires `AFTER UPDATE ON reservations`. Whenever reservation status changes (e.g. `CONFIRMED` $\to$ `CANCELLED` or `NO_SHOW`), the trigger automatically writes a timestamped JSON snapshot of old values and new values into the `audit_logs` table.
- **Negative Balance Guardrail Trigger (`trg_prevent_negative_rewards`):**
  Fires `BEFORE INSERT ON reward_ledgers`. If `NEW.balance_after < 0`, it raises:
  ```sql
  SIGNAL SQLSTATE '45000' 
  SET MESSAGE_TEXT = 'Integrity constraint violated: Reward points balance cannot drop below zero.';
  ```

## 4.3 Concept 3: Stored Procedures & Dynamic Fee Calculation
- **Implementation File:** `database/procedures.sql` & `database/demos/03_stored_procedures_pricing.sql`
- **Procedure (`sp_calculate_parking_fee`):**
  Encapsulates billing business logic directly within MySQL. Evaluates base hourly rate, duration in hours, matching active pricing rules (peak hours vs off-peak hours), category surcharges (EV fast charging), and minimum charges:
  ```sql
  CALL sp_calculate_parking_fee(p_slot_id, p_start_time, p_end_time, @fee, @rate, @rule);
  ```

## 4.4 Concept 4: Database Views & Indexing Strategy
- **Views:**
  - `v_active_occupancy`: Real-time aggregation computing `currently_occupied`, `currently_available`, and `occupancy_percentage`.
  - `v_facility_revenue_summary`: Joins reservations and payments, returning total revenue, average ticket size, and average duration per facility.
  - `v_user_parking_stats`: Personal behavioral metrics per customer.
- **Indexes:**
  - `idx_res_slot_time_status (slot_id, start_time, end_time, status)`: Primary index accelerating interval collision checks.
  - `idx_facility_coords (latitude, longitude)`: B-Tree index accelerating geographic radius searches.
  - `idx_wait_queue (facility_id, status, priority_level, created_at)`: Accelerates FIFO + Priority waitlist candidate lookups.
