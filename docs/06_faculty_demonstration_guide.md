# 6. FACULTY EVALUATION DEMONSTRATION SCRIPT

This guide provides a structured 5-minute demonstration script for evaluating the ParkWise project with a DBMS professor or grading panel.

---

## Step 1: Multi-Paradigm Database Architecture (1 Minute)
1. **Show MySQL Database in Workbench / CLI:**
   ```sql
   USE parkwise_db;
   SHOW TABLES;
   ```
   *Explain:* 15 normalized 3NF tables handling authoritative state, financial payments, and concurrency locks.
2. **Show Database Views:**
   ```sql
   SELECT * FROM v_active_occupancy;
   SELECT * FROM v_facility_revenue_summary;
   ```
   *Explain:* Demonstrates multi-table joins and real-time operational calculations without denormalization.
3. **Show Secondary Database (MongoDB):**
   *Explain:* MongoDB handles flexible review text, incident descriptions, and aggregation pipelines (`$group`, `$match`).

---

## Step 2: Concurrency & Booking Conflict Prevention (1.5 Minutes)
1. **Explain the Race Condition Problem:**
   Two users clicking "Book Slot" at the exact same second for overlapping intervals.
2. **Demonstrate Row Locking in SQL:**
   Show `database/demos/01_concurrency_conflict_prevention.sql` or run the automated test:
   ```bash
   npm test
   ```
   *Highlight:* Test 3 fires two concurrent asynchronous booking promises against `s-pesu-201`. Exactly ONE confirms, and the other safely rolls back with a 409 conflict message.

---

## Step 3: Stored Procedures & Database Triggers (1 Minute)
1. **Fee Calculation Stored Procedure:**
   ```sql
   CALL sp_calculate_parking_fee('s-pesu-101', '2026-10-15 09:00:00', '2026-10-15 11:00:00', @fee, @rate, @rule);
   SELECT @fee, @rate, @rule;
   ```
   *Highlight:* Evaluates morning peak commute multiplier (1.35x) directly inside MySQL.
2. **Database Trigger Guardrail:**
   Show `trg_prevent_negative_rewards`:
   *Highlight:* Attempting an illegal insert with negative points balance triggers a `SIGNAL SQLSTATE '45000'` integrity exception.

---

## Step 4: Web Application Flow & Navigation (1.5 Minutes)
1. **Login with Demo Account:**
   Visit `/login` and click "Priority 1 (Sarah Connor)".
2. **Interactive Map & Destination Search:**
   Visit `/map`, search "PES University", and show:
   - Route A: Driving route from Origin to Parking Hub (OSRM).
   - Route B: Walking route from Parking Hub to Destination (OSRM Foot).
3. **Smart Slot Recommendation:**
   Visit `/recommendations`, evaluate slots, and inspect the 0–100 Suitability Score breakdown table.
4. **Cancellation & Automatic Reallocation:**
   Cancel a booking in `/reservations` and show how the top waiting-list candidate is atomically promoted.
