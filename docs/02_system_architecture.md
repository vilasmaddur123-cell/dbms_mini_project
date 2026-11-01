# 2. SYSTEM ARCHITECTURE & TECHNOLOGY JUSTIFICATION

## 2.1 Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   Next.js 14 App Router (React 18 / TypeScript / Tailwind CSS / Leaflet Map)    |
|   [Customer Portal]             [Admin Operations Hub]        [Interactive Map] |
+---------------------------------------+-----------------------------------------+
                                        | HTTPS / REST JSON API
+---------------------------------------v-----------------------------------------+
|                              SERVER APPLICATION LAYER                           |
|   Next.js Route Handlers / Node.js 20 LTS Runtime                               |
|   - Authentication & Session Verification (Argon2 / Bcrypt / HMAC-SHA256)       |
|   - Zod Input Validation & Security Sanitization                                |
|   - Recommendation & Suitability Engine (0-100 Score Breakdown)                 |
|   - Historical Availability Prediction Engine (SQL Aggregation)                 |
|   - Dynamic Pricing & Stored Procedure Engine                                   |
|   - Concurrency-Safe Transaction Manager                                        |
|   - Routing & Geocoding Integration Proxy (OSRM & Nominatim)                    |
+-------------------+-----------------------------------------+-------------------+
                    |                                         |
     Authoritative SQL Queries               Flexible Document Operations
                    |                                         |
+-------------------v-------------------+ +-------------------v-------------------+
|     PRIMARY RELATIONAL DATABASE       | |    SECONDARY DOCUMENT DATABASE        |
|             MySQL 8.0                 | |             MongoDB 7.0               |
|                                       | |                                       |
| - Users, Roles, Vehicles              | | - Flexible Feedback Documents         |
| - Facilities, Parking Slots           | | - Operational Incident Reports        |
| - Authoritative Reservations          | | - Recommendation Explanation Logs     |
| - Simulated Payment Records           | | - Aggregation Pipelines ($match,      |
| - Priority & Waiting-List Queues      | |   $group, $project, $sort)            |
| - Dynamic Pricing Rules               | |                                       |
| - Immutable Reward Ledgers            | |                                       |
| - Stored Procedures & Triggers        | |                                       |
| - Database Views & Audit Logs         | |                                       |
+---------------------------------------+ +---------------------------------------+
```

## 2.2 Technology Stack Justification
- **Next.js 14 App Router & TypeScript:** Offers unified full-stack architecture with server-side validation, robust type safety, and fast edge rendering.
- **Tailwind CSS:** Enables accessible, responsive user interfaces across mobile and desktop breakpoints without bloated CSS files.
- **MySQL 8.0 (Primary Store):** Relational integrity, foreign key cascades, ACID transactional boundaries, strict isolation levels, row-level pessimistic locking (`FOR UPDATE`), and server-side stored procedures/triggers make MySQL the authoritative source for bookings, payments, and ledger balances.
- **MongoDB 7.0 (Secondary Store):** Freeform review comments, user feedback ratings, incident narratives, and unstructured audit metadata fit the document paradigm naturally, showcasing multi-paradigm database integration.
- **Leaflet & OpenStreetMap:** Open, license-compliant interactive web mapping without closed proprietary dependencies.
- **OSRM (Open Source Routing Machine):** Supplies high-performance polyline generation, realistic road travel times, and pedestrian walking durations between origin, parking facility, and destination.
