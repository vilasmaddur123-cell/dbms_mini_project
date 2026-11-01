# 1. PROBLEM STATEMENT, MOTIVATION & OBJECTIVES

## 1.1 Problem Statement
Urban drivers waste an estimated 20 minutes per commute seeking available parking spaces, leading to traffic congestion, heightened carbon emissions, and user frustration. Conventional parking systems operate either as static directories or disjointed hardware monitors that fail to provide:
1. Guaranteed advance reservation without concurrency race conditions.
2. Personalized recommendations based on walking distance, budget, floor preferences, and EV/accessibility needs.
3. Accurate historical availability forecasts to plan arrival windows.
4. Transparent, time-based dynamic pricing reflecting peak vs. off-peak demand.
5. Automated, fair waiting-list reallocation when confirmed reservations are cancelled.

## 1.2 Motivation
In an academic Database Management Systems (DBMS) Level 3 project, the mission is to demonstrate robust database design, transaction isolation, multiple database paradigms (relational MySQL and document-oriented MongoDB), and database-driven algorithmic decision-making rather than black-box approximations.

## 1.3 Project Objectives
- **Authoritative ACID Consistency:** Enforce zero double-booking under concurrent user requests using MySQL pessimistic row locking (`SELECT ... FOR UPDATE`).
- **Advanced SQL Implementation:** Embed and demonstrate stored procedures (`sp_calculate_parking_fee`), database triggers (`trg_after_reservation_update_audit`, `trg_prevent_negative_rewards`), multi-table views, composite indexes, and complex analytical SQL.
- **Multi-Paradigm DBMS Integration:** Use MySQL for authoritative financial and reservation records, and MongoDB for flexible customer feedback, incident reports, and aggregation pipelines.
- **Algorithmic Decision Engines:**
  - Transparent 0–100 suitability score for personalized slot recommendations.
  - Baseline historical availability prediction aggregating past completed sessions.
  - Deterministic priority queue ordering and atomic waiting-list reallocation upon cancellation.
- **End-to-End Navigation:** Integrated interactive OpenStreetMap and OSRM routing displaying Route A (origin to parking facility) and Route B (parking facility to final destination).
