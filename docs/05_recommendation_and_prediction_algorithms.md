# 5. RECOMMENDATION & AVAILABILITY PREDICTION ALGORITHMS

## 5.1 Smart Slot Recommendation Engine (0–100 Normalized Score)

### Step 1: Mandatory Hard Constraints (Pre-Filtering)
Candidates are filtered out if any of the following fail:
1. `slot.is_active = TRUE` and `facility.is_active = TRUE`.
2. Slot is not in `MAINTENANCE` status.
3. Interval availability: Zero overlapping confirmed reservations.
4. If `require_ev = TRUE`, `slot.is_ev_charging` must be `TRUE`.
5. If `require_accessible = TRUE`, `slot.is_accessible` must be `TRUE`.
6. If `max_hourly_budget` is set, `slot.base_hourly_rate <= max_hourly_budget`.

### Step 2: Suitability Scoring Formula (0 to 100 Scale)
For every qualifying candidate slot $s$, the base score starts at 50, and factor points are computed:

$$\text{Score}(s) = \min(100, \max(1, 50 + P_{\text{price}} + P_{\text{floor}} + P_{\text{proximity}} + P_{\text{covered}} + P_{\text{destination}} + P_{\text{amenities}}))$$

1. **Price Economy ($P_{\text{price}}$, max 20 pts):**
   $$P_{\text{price}} = \text{round}\left(20 \times \frac{\text{Budget} - \text{Rate}}{\text{Budget}}\right)$$
2. **Floor Level Match ($P_{\text{floor}}$, max 15 pts):**
   Full 15 pts if slot matches user's preferred floor; drops by 5 pts per floor difference.
3. **Proximity to Entrance / Lift ($P_{\text{proximity}}$, max 15 pts):**
   +8 pts if near main entrance barrier; +7 pts if adjacent to elevator lift.
4. **Weather Protection ($P_{\text{covered}}$, max 10 pts):**
   +10 pts for covered parking bays.
5. **Walking Distance to Destination ($P_{\text{destination}}$, max 20 pts):**
   $$P_{\text{destination}} = \max\left(0, \text{round}\left(20 \times \left(1 - \frac{\text{Distance}}{1200\text{m}}\right)\right)\right)$$
6. **EV / Accessible Feature Match ($P_{\text{amenities}}$, max 10 pts):**
   +5 pts for EV fast charger; +5 pts for wide ADA bay.

---

## 5.2 Future Parking Availability Prediction Model

The availability prediction engine relies on SQL aggregations over historical parking records rather than unsupported claims:

1. **Sample Selection:**
   Pulls historical sessions matching target facility, day of week (`DAYOFWEEK(start_time)`), and target hour of day.
2. **Turnover Estimation:**
   Computes average historical session duration ($\overline{D}$) and session throughput:
   $$\overline{D} = \text{AVG}(\text{TIMESTAMPDIFF}(\text{MINUTE}, \text{start\_time}, \text{end\_time}))$$
3. **Occupancy Pressure:**
   $$\text{EstimatedOccupied} = \min(T, \text{round}(N \times 0.8 \times (1 - R_{\text{cancel}} - R_{\text{noshow}})))$$
   $$\text{AvailabilityPct} = \text{round}\left(\frac{T - \text{EstimatedOccupied}}{T} \times 100\right)$$
4. **Statistical Confidence:**
   Confidence scales proportionally with sample size:
   $$\text{Confidence} = \min(95, 40 + N \times 8)$$
5. **Insufficient Data Fallback:**
   If $N < 2$, the system flags `isSufficientData = false` and returns a conservative baseline notice:
   *"Insufficient historical data for this specific day/hour combination."*
