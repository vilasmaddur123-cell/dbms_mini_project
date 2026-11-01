# 3. ENTITY-RELATIONSHIP (ER) DIAGRAM & RELATIONAL SCHEMA

## 3.1 Mermaid ER Diagram

```mermaid
erDiagram
    USERS ||--o{ VEHICLES : "registers"
    USERS ||--o| USER_PREFERENCES : "defines"
    USERS ||--o{ PRIORITY_ELIGIBILITIES : "holds"
    USERS ||--o{ RESERVATIONS : "books"
    USERS ||--o{ WAITING_LIST_ENTRIES : "joins"
    USERS ||--o{ REWARD_LEDGERS : "earns_spends"
    USERS ||--o{ NOTIFICATIONS : "receives"
    
    PARKING_FACILITIES ||--o{ PARKING_SLOTS : "contains"
    PARKING_FACILITIES ||--o{ PRICING_RULES : "governs"
    PARKING_FACILITIES ||--o{ WAITING_LIST_ENTRIES : "queues_at"
    
    PARKING_SLOTS ||--o{ RESERVATIONS : "allocated_to"
    
    RESERVATIONS ||--|| PAYMENT_RECORDS : "billed_as"
    RESERVATIONS ||--o| ENTRY_EXIT_RECORDS : "tracks"
    RESERVATIONS ||--o| NO_SHOW_RECORDS : "penalized_by"
    
    USERS {
        string id PK
        string name
        string email UK
        string password_hash
        string role "CUSTOMER | ADMIN"
        string phone
        datetime created_at
    }

    VEHICLES {
        string id PK
        string user_id FK
        string license_plate UK
        string make
        string model
        boolean is_ev
    }

    PARKING_FACILITIES {
        string id PK
        string name
        string address
        decimal latitude
        decimal longitude
        int total_floors
        int total_slots
        boolean is_active
    }

    PARKING_SLOTS {
        string id PK
        string facility_id FK
        string slot_number
        int floor
        string category "STANDARD | EV | ACCESSIBLE | VIP"
        boolean is_covered
        boolean near_entrance
        boolean near_exit
        boolean near_lift
        boolean is_ev_charging
        boolean is_accessible
        int distance_to_entrance_m
        decimal base_hourly_rate
        string status "AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE"
    }

    RESERVATIONS {
        string id PK
        string user_id FK
        string slot_id FK
        string vehicle_id FK
        datetime start_time
        datetime end_time
        decimal total_price
        decimal applied_hourly_rate
        json pricing_breakdown
        string status "CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED | NO_SHOW"
        string idempotency_key UK
    }

    PAYMENT_RECORDS {
        string id PK
        string reservation_id FK
        string user_id FK
        decimal amount
        string payment_method
        string status "SUCCEEDED | REFUNDED"
        string transaction_reference UK
    }

    WAITING_LIST_ENTRIES {
        string id PK
        string user_id FK
        string facility_id FK
        datetime start_time
        datetime end_time
        int priority_level
        string status "WAITING | OFFERED | ACCEPTED | CANCELLED"
        datetime expires_at
    }

    REWARD_LEDGERS {
        string id PK
        string user_id FK
        int points
        string type
        string reference_id
        int balance_after
        string description
    }
```

## 3.2 Relational Integrity & Normalization (3NF)
1. **First Normal Form (1NF):** All table attributes contain atomic values. Composite attributes such as names, coordinates, and intervals are separated into discrete, non-repeating columns.
2. **Second Normal Form (2NF):** Every non-key attribute is fully functionally dependent on the entire primary key. In tables with composite unique keys (e.g., `facility_id, slot_number`), attributes like `floor`, `category`, and `is_covered` depend on the unique slot identity, not subsets.
3. **Third Normal Form (3NF):** No transitive dependencies exist. Facility address and coordinates belong strictly to `parking_facilities`; slots reference only `facility_id`. User reward balances are dynamically reconciled from immutable ledger records rather than stored as redundant, mutable duplicate fields.
