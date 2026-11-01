# 🅿️ ParkWise — Intelligent Smart Parking & Reservation Platform
> **University DBMS Level 3 Capstone Project**  
> *A high-concurrency smart parking system demonstrating multi-paradigm database architecture, ACID transactions, stored procedures, triggers, transparent scoring algorithms, and interactive Leaflet navigation.*

---

## 🌟 Key Highlights

- **Multi-Paradigm DBMS Architecture:** 
  - **MySQL 8.0:** Authoritative relational store managing users, facilities, parking slots, reservations, payments, waiting lists, reward ledgers, stored procedures, triggers, and views.
  - **MongoDB 7.0:** Document store handling flexible feedback documents, operational incident descriptions, and complex aggregation pipelines.
- **ACID Concurrency Safety:** Pessimistic row locking (`SELECT ... FOR UPDATE`) prevents overlapping confirmed bookings under high-load race conditions.
- **Smart Slot Recommendation:** Transparent 0–100 suitability scoring incorporating price, floor level, walking distance, weather cover, and amenities.
- **Historical Availability Prediction:** Baseline SQL aggregation forecasting slot turnover and confidence scores.
- **Dynamic Pricing Rules:** MySQL Stored Procedure `sp_calculate_parking_fee` computing peak-hour multipliers, weekend rates, and EV surcharges.
- **Interactive Web Navigation:** Leaflet map with OpenStreetMap tiles, destination geocoding, Route A (driving from origin to parking), and Route B (walking from parking to destination).
- **Automated Reallocation & No-Show Enforcement:** Reallocates cancelled slots to top priority queue candidates; expires no-shows after configurable grace period.

---

## 📋 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Interactive Map** | Leaflet, React Leaflet, OpenStreetMap, Project OSRM Routing, Nominatim Geocoding |
| **Relational DBMS** | MySQL 8.0 (mysql2 connection pool, Prisma schema, ACID transactions) |
| **Document DBMS** | MongoDB 7.0 (Official Node.js driver + MongoMemoryServer embedded fallback) |
| **Security & Auth** | Bcrypt password hashing, HMAC-SHA256 HttpOnly session cookies, Zod validation |
| **Testing** | Node.js TS-Node test runner covering unit, concurrency, and security suites |

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- **Node.js:** v18+ or v20 LTS
- **MySQL Server:** v8.0+ running on port 3306

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure it with your local database credentials. Set `SESSION_SECRET` to a unique random value; for example, generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Do not commit `.env`.

### 3. Initialize & Seed Database
Run the automated schema creation and demo seed scripts:
```bash
npm run db:init
npm run db:seed
```

### 4. Start the Application
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run the Comprehensive Automated Test Suite
To execute the complete test suite verifying concurrency locking, pricing, predictions, and security:
```bash
npm test
```

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Features Highlighted |
|---|---|---|---|
| **System Admin** | `admin@parkwise.com` | `Admin@123` | Operations hub, no-show triggers, audit logs, feedback moderation |
| **Regular Customer** | `john.doe@example.com` | `Password@123` | Active bookings, check-in barrier pass, reward points voucher redemption |
| **Priority 1 (Accessibility)** | `sarah.connor@example.com` | `Password@123` | Ground floor preference, wheelchair accessible bay priority boost |
| **Priority 2 (Faculty)** | `david.miller@example.com` | `Password@123` | Faculty ranking, fast-track waiting list queue allocation |

---

## 📂 Project Directory Structure

```
d:\dbms_project\
├── database/                     # Authoritative SQL & Demo Scripts
│   ├── schema.sql                # DDL: 15 Tables, Foreign Keys, Check Constraints
│   ├── views.sql                 # DDL: Real-time Occupancy & Revenue Views
│   ├── procedures.sql            # DDL: Fee Calculation & No-Show Stored Procedures
│   ├── triggers.sql              # DDL: Audit Logging & Reward Integrity Triggers
│   ├── seed.sql                  # DML: Bangalore Facilities, Slots, Past Sessions
│   └── demos/                    # Executable DBMS Level 3 SQL Demos
│       ├── 01_concurrency_conflict_prevention.sql
│       ├── 02_triggers_audit_ledger.sql
│       ├── 03_stored_procedures_pricing.sql
│       ├── 04_indexes_and_explain.sql
│       ├── 05_views_and_aggregates.sql
│       └── 06_mongodb_aggregation.js
├── docs/                         # Comprehensive Academic Documentation
│   ├── 01_problem_and_objectives.md
│   ├── 02_system_architecture.md
│   ├── 03_er_diagram_and_schema.md
│   ├── 04_advanced_sql_features.md
│   ├── 05_recommendation_and_prediction_algorithms.md
│   └── 06_faculty_demonstration_guide.md
├── src/
│   ├── app/                      # Next.js 14 App Router Pages & API Routes
│   │   ├── (public)/login, register, page.tsx
│   │   ├── map/page.tsx          # Leaflet Map, Destination Search & OSRM Routing
│   │   ├── recommendations/      # Smart Recommendations & Suitability Table
│   │   ├── predictions/          # Availability Prediction Engine
│   │   ├── reservations/         # Booking History, Check-in/Out & Cancellation
│   │   ├── waitlist/             # Priority Waiting List Queue Manager
│   │   ├── rewards/              # Points Balance & Immutable Ledger
│   │   ├── analytics/            # SQL Behavioral Analytics (User & Admin)
│   │   ├── feedback/             # MongoDB Feedback & Incident Reports
│   │   ├── admin/                # Admin Operations Hub
│   │   └── api/                  # 20+ Protected Backend REST Endpoints
│   ├── components/               # Navbar, Footer, MapComponent, ComparisonTable
│   └── lib/                      # Core Business Logic & Database Clients
│       ├── db.ts                 # MySQL Connection Pool
│       ├── mongodb.ts            # MongoDB Driver Client
│       ├── auth.ts               # Bcrypt & HMAC Sessions
│       ├── pricing.ts            # Dynamic Pricing Engine
│       ├── recommendation.ts     # 0-100 Suitability Scoring Formula
│       ├── prediction.ts         # Historical Availability Aggregator
│       ├── reservations.ts       # Row-Locked Booking Transaction Engine
│       ├── reallocation.ts       # Atomic Waitlist Promotion Engine
│       ├── rewards.ts            # Immutable Ledger Manager
│       ├── routing.ts            # OSRM & Nominatim Integration
│       └── validation.ts         # Zod Schemas
└── tests/
    └── run_all_tests.ts          # Comprehensive 15-Group Test Suite
```

---

## 🎓 DBMS Level 3 Concepts Demonstrated

1. **Transaction Isolation:** Row locking (`SELECT ... FOR UPDATE`) prevents race conditions between simultaneous booking requests.
2. **Triggers:** Automatic JSON auditing on status changes; integrity trigger raising `SIGNAL SQLSTATE '45000'` on negative reward balances.
3. **Stored Procedures:** Server-side billing computation via `sp_calculate_parking_fee` and batch no-show detection via `sp_detect_and_process_noshows`.
4. **Views:** Aggregates real-time occupancy (`v_active_occupancy`) and facility financial metrics (`v_facility_revenue_summary`).
5. **NoSQL Document Store:** Flexible feedback and incident narratives stored in MongoDB collections with multi-stage aggregation pipelines.
