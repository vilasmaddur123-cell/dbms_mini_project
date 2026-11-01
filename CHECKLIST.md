# PARKWISE SMART PARKING SYSTEM — MASTER VERIFICATION CHECKLIST

| # | Requirement | Implementation Location | Verification Method | Status | Notes |
|---|-------------|-------------------------|---------------------|--------|-------|
| 1 | Smart slot recommendation | `src/lib/recommendation.ts`, `src/app/api/recommendations/route.ts` | Unit/API test with constraints & preference scoring | PENDING | Configurable 0-100 score with explanations |
| 2 | Future slot availability prediction | `src/lib/prediction.ts`, `src/app/api/predictions/route.ts` | SQL aggregation test on historical sessions | PENDING | Confidence, duration window & insufficient data fallback |
| 3 | Priority parking | `src/lib/priority.ts`, `src/app/api/priority/route.ts` | Multi-category priority test (Accessibility, VIP, Membership) | PENDING | Priority levels, precedence & waitlist boost |
| 4 | Automatic slot reallocation | `src/lib/reallocation.ts`, `src/app/api/reservations/[id]/cancel/route.ts` | Cancellation transaction test with candidate promotion | PENDING | Atomic reallocation, idempotency, audit event |
| 5 | Parking suitability score | `src/lib/suitability.ts`, UI component `SuitabilityComparisonTable.tsx` | Formula verification with normalized factor weights | PENDING | Price, walking dist, floor, amenities breakdown |
| 6 | Time-based pricing | `src/lib/pricing.ts`, MySQL SP `sp_calculate_parking_fee` | Boundary times, peak/off-peak, duration tests | PENDING | Stored procedure & application fallback |
| 7 | Parking rewards | `src/lib/rewards.ts`, MySQL table `reward_ledgers` | Immutable ledger test, concurrency & balance checks | PENDING | Duplicate prevention via composite constraints |
| 8 | No-show detection | `src/lib/noshow.ts`, `src/app/api/admin/noshow/route.ts` | Grace period expiry test, idempotent processing | PENDING | Warning records, appeal workflow |
| 9 | Waiting list | `src/lib/waitlist.ts`, `src/app/api/waitlist/route.ts` | Deterministic FIFO + Priority order test | PENDING | State machine: WAITING -> OFFERED -> ACCEPTED |
| 10 | Booking conflict prevention | `src/lib/reservations.ts`, `tests/booking_conflict.test.ts` | Concurrent booking race condition test | PENDING | MySQL `FOR UPDATE` row lock & interval collision |
| 11 | Parking slot preferences | `src/lib/preferences.ts`, `src/app/api/preferences/route.ts` | Preference persistence & mandatory constraint filter | PENDING | Search filtering with fallback suggestions |
| 12 | User parking behavior analytics | `src/lib/analytics.ts`, `src/app/api/analytics/route.ts` | SQL queries with GROUP BY, HAVING, subqueries | PENDING | Customer personal stats & Admin facility metrics |
| 13 | Interactive map & destination search | `src/components/MapComponent.tsx`, Leaflet, Nominatim API | Interactive UI & geocoding proxy test | PENDING | Arbitrary query resolving, radius filtering |
| 14 | Current-location & manual-origin | `src/components/MapComponent.tsx` | Geolocation API integration & fallback input | PENDING | HTTPS/localhost secure context handling |
| 15 | Route to parking facility | `src/lib/routing.ts`, OSRM API proxy | Polyline rendering, driving distance & duration | PENDING | Real OSRM response with fallback coordinates |
| 16 | Walking route to destination | `src/lib/routing.ts`, OSRM foot walking profile | Walking polyline, walking distance & duration | PENDING | Foot routing from facility to searched destination |
| 17 | User feedback & incident management | `src/lib/feedback.ts`, MongoDB `feedbacks` collection | MongoDB CRUD & Aggregation pipeline test | PENDING | 1-5 stars, categories, admin moderation |
| 18 | Customer/admin roles | `src/lib/auth.ts`, middleware/session validation | RBAC test: customer restricted, admin privileged | PENDING | Enforced server-side on all protected routes |
| 19 | MySQL schema and ER diagram | `database/schema.sql`, `docs/03_er_diagram_and_schema.md` | Schema inspection, 3NF validation, constraints | PENDING | 15+ normalized tables with relational integrity |
| 20 | MongoDB integration & aggregation | `src/lib/mongodb.ts`, `docs/05_nosql_mongodb_design.md` | Genuine MongoDB connection & `$group`, `$match` pipeline | PENDING | Document schema, indexes, aggregation queries |
| 21 | SQL DDL and DML | `database/schema.sql`, `database/seed.sql` | Executed against MySQL 8.0 instance | PENDING | CREATE, ALTER, INSERT, UPDATE, DELETE, SELECT |
| 22 | Advanced SQL features | `database/demos/` (Transactions, Triggers, SPs, Indexes, Views) | Executable SQL test scripts | PENDING | Explicit DBMS Level 3 demonstrations |
| 23 | Authentication & authorization | `src/lib/auth.ts`, Argon2/bcrypt + HttpOnly cookie | Session verification, password hash security | PENDING | Rate-limiting & server-side validation |
| 24 | Input validation & security | `src/lib/validation.ts` (Zod), parameterized queries | SQL/NoSQL injection test cases | PENDING | Injection prevention & XSS sanitization |
| 25 | Automated testing | `tests/` suite (Jest / TS-Node) | Test suite execution report | PENDING | Unit, integration & concurrency tests |
| 26 | Documentation | `docs/` complete 13 documentation files | Facets review (architecture, ER, algorithms, etc.) | PENDING | University submission grade docs |
| 27 | Git/GitHub readiness | `.gitignore`, `README.md`, `.env.example` | Repository clean structure | PENDING | Standard clean repository |
| 28 | Successful build & startup | `npm run build`, `npm run dev` / `npm start` | Clean Next.js compilation & server launch | PENDING | No runtime or compilation errors |
