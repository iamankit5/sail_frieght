# SAIL Maritime Intelligence Platform — Data Provenance & Source Disclosures

> **Standardized Classification of Data Sources for Fiduciary Transparency**

---

## 1. Provenance Classification Framework

Every metric presented in the SAIL Maritime Procurement Platform is tagged with an unambiguous provenance badge. This ensures procurement officers and competition judges can verify whether a number is an empirical live feed, a published benchmark, or a calculated estimate.

| Badge | Classification | Verification Standard |
|:---:|:---|:---|
| <span style="color:#10b981;font-weight:bold">LIVE</span> | **Real-Time Active Feed** | Retrieved directly during the current application session from an external source (Open-Meteo Weather API, live USD/INR or Crude spot). |
| <span style="color:#38bdf8;font-weight:bold">HISTORICAL</span> | **Empirical Historical Series** | Real recorded market data spanning 2021 to the present (Baltic Dry Index $BDRY$, historical bunker records). |
| <span style="color:#f59e0b;font-weight:bold">ESTIMATED</span> | **Formula-Derived Value** | Mathematical transformation of real inputs using validated industry ratios (e.g. bunker price from crude, landed cost per MT, multi-horizon forecast bands). |
| <span style="color:#c084fc;font-weight:bold">BENCHMARK</span> | **Industry Reference Baseline** | Published standard maritime specifications (Clarksons Research 2024 dry bulk spot ranges, Sea-Distances.org nautical tables, Major Ports Authority draft tables). |
| <span style="color:#818cf8;font-weight:bold">DEMO</span> | **Presentation Preset** | Pre-configured baseline scenario parameters calibrated for competition demonstration (Newcastle $\to$ Paradip 75,000 MT Coking Coal). |

---

## 2. Parameter Mapping & Data Citations

### A. Ocean Routes & Nautical Distances
- **Source**: Sea-Distances.org maritime route computation tables.
- **Classification**: `BENCHMARK`
- **Distances in Nautical Miles (NM)**:
  - Australia (Newcastle) $\to$ Paradip: **4,580 NM** | Haldia: **4,680 NM** | Vizag: **4,420 NM** | Dhamra: **4,560 NM**
  - Australia (Hay Point) $\to$ Paradip: **4,320 NM** | Haldia: **4,420 NM** | Vizag: **4,180 NM** | Dhamra: **4,300 NM**
  - Indonesia (Samarinda) $\to$ Paradip: **2,180 NM** | Haldia: **2,320 NM** | Vizag: **2,080 NM** | Dhamra: **2,220 NM**
  - Mozambique (Maputo) $\to$ Paradip: **3,880 NM** | Haldia: **4,020 NM** | Vizag: **3,740 NM** | Dhamra: **3,920 NM**
  - USA (New Orleans) $\to$ Paradip: **9,820 NM** | Haldia: **9,960 NM** | Vizag: **9,680 NM** | Dhamra: **9,860 NM**
  - Russia (Vladivostok) $\to$ Paradip: **4,760 NM** | Haldia: **4,900 NM** | Vizag: **4,620 NM** | Dhamra: **4,800 NM**

### B. Discharge Port Operational Limits & Draft Constraints
- **Source**: Indian Major Ports Authority berth master guidelines.
- **Classification**: `BENCHMARK`
- **Constraints**:
  - **Haldia Port**: Max Permissible Draft = **8.5 m** (Shallow riverine channel). Panamax and Capesize vessels physically exceed channel depth and are strictly classified as **INFEASIBLE**.
  - **Paradip Port**: Max Permissible Draft = **14.5 m** | Waiting time ~2.5 days. Accommodates Handysize, Supramax, and Panamax.
  - **Vizag Port**: Max Permissible Draft = **14.5 m** | Waiting time ~2.0 days. Accommodates Handysize, Supramax, and Panamax.
  - **Dhamra Port**: Max Permissible Draft = **18.0 m** (Deepwater berth) | Waiting time ~1.8 days. Accommodates fully laden Capesize vessels.

### C. Vessel Fleet Specifications & Daily Hire Rates
- **Source**: Clarksons Research 2024 Spot Market Dry Bulk Benchmarks.
- **Classification**: `BENCHMARK`
- **Parameters**:
  - **Handysize**: 35,000 DWT | Speed: 13 knots | Fuel: 20 MT/day | Daily Hire: $11,500 | Draft: 10.0m
  - **Supramax**: 55,000 DWT | Speed: 14 knots | Fuel: 25 MT/day | Daily Hire: $14,500 | Draft: 11.5m
  - **Panamax**: 75,000 DWT | Speed: 14 knots | Fuel: 30 MT/day | Daily Hire: $16,500 | Draft: 13.5m
  - **Capesize**: 180,000 DWT | Speed: 13 knots | Fuel: 45 MT/day | Daily Hire: $24,500 | Draft: 18.2m

### D. Bunker Fuel Pricing & Conversion Formula
- **Source**: Yahoo Finance crude oil futures ticker (`CL=F`) or fallback Clarksons spot benchmark ($625.0/MT).
- **Classification**: `LIVE` (when online) / `ESTIMATED` (formula derived) / `BENCHMARK` (offline fallback).
- **Formula**:
  $$\text{Bunker Price (USD/MT)} = \text{Crude Spot Price (USD/bbl)} \times 7.33$$
  *(Where 7.33 is the standard maritime conversion factor of barrels of crude to metric tonnes of heavy fuel oil/VLSFO).*

### E. Port Meteorological Forecast
- **Source**: Open-Meteo Global Weather API (open access, CORS-enabled, zero API keys required).
- **Classification**: `LIVE`
- **Parameters**: 5-day forecast for temperature min/max and cumulative precipitation.

---

## 3. Landed Cost Calculation Methodology

The total landed cost per metric tonne ($\text{Cost}_{\text{MT}}$) is computed deterministically:

$$\text{Voyage Days} = \frac{\text{Distance (NM)}}{\text{Speed (knots)} \times 24}$$

$$\text{Fuel Cost} = \text{Voyage Days} \times \text{Fuel/Day} \times \text{Bunker Price}$$

$$\text{Charter Cost} = \text{Voyage Days} \times \text{Daily Hire Rate} \times \text{Freight Multiplier}$$

$$\text{Port \& Canal Fees} = \$35,000 + (\text{USA route: } \$8,500 \text{ else } \$2,000)$$

$$\text{Demurrage Risk Buffer} = \begin{cases} \$12,000 & \text{for High risk vessels} \\ \$6,000 & \text{for Medium risk vessels} \\ \$2,500 & \text{for Low risk vessels} \end{cases}$$

$$\text{Total Voyage Expense} = \text{Fuel Cost} + \text{Charter Cost} + \text{Port \& Canal Fees} + \text{Demurrage Risk}$$

$$\text{Total Landed Cost / MT} = \frac{\text{Total Voyage Expense}}{\text{Cargo Quantity (MT)}}$$

$$\text{Physical Infeasibility Rule}: \quad \text{If } \text{Draft}_{\text{vessel}} > \text{Draft}_{\text{port}} \implies \text{Status} = \mathbf{\text{🔴 INFEASIBLE}}$$
