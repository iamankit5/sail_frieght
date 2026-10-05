# Data Provenance & Licensing Posture

> **Commercial rule:** every number the engine uses is either (1) a customer-configurable assumption, (2) self-derived with a documented method, or (3) sourced under a commercial license on file. See [COMMERCIALIZATION_PLAN.md](COMMERCIALIZATION_PLAN.md) §3 for the licensing strategy and cost notes.

---

## 1. Provenance Classification

Every metric in the terminal carries a provenance badge:

| Badge | Meaning | Verification standard |
|:---:|:---|:---|
| `LIVE` | Real-time active feed | Retrieved during the current session from the configured provider (USD/INR FX, crude spot) |
| `HISTORICAL` | Empirical historical series | Retained in the platform's own dataset (freight-market ETF series) |
| `ESTIMATED` | Formula-derived value | Documented planning formula applied to real inputs (bunker estimate from crude, landed cost per MT, forecast bands). **Not a market quote.** |
| `BENCHMARK` | Self-derived reference | Great-circle distance methodology; public port authority notices |
| `DEMO` | Synthetic demo data | Served only behind `DEMO_MODE=1`, always labeled synthetic — never real market data |

## 2. Per-Item Source & Licensing Table

| Data item | Where used | Method / source | Commercial status |
|:---|:---|:---|:---|
| **Route distances** | `shared/engine_config.json` | Self-derived: great-circle (haversine) between public port coordinates × documented detour factors; US Gulf lanes via Suez Canal waypoints. Generator & method: `shared/derive_distances.py` | ✅ Owned methodology — no vendor dependency |
| **Port draft limits, waiting days** | engine config | Public port authority berth guidelines (e.g. Haldia riverine ~8.5 m, Dhamra deepwater ~18.0 m) | ✅ Public facts — cite the authority; re-verify against latest notices before commercial reliance |
| **Vessel hire rates, speeds, capacities** | engine config | Operator-editable planning assumptions | ⚠️ Not licensed data — operators must validate against their own broker intelligence; optionally license a market feed later |
| **Cargo handling fees, stowage factors, demurrage buffers, port/canal charges** | engine config | Operator-editable planning assumptions | ⚠️ Same as above |
| **USD/INR FX** | `backend/app/services/market_service.py` | Yahoo Finance → open keyless FX APIs (Open-ER, Frankfurter/ECB) | ⚠️ **Dev-time only**: Yahoo's ToS prohibits commercial redistribution. Before charging customers: use a licensed FX feed (ECB/central-bank reference rates are free) or customer-supplied rates |
| **Crude spot** | market service | Yahoo Finance `CL=F` / `BZ=F` | ⚠️ Same — replace with a licensed commodity feed for production |
| **Bunker $/MT** | market service | **ESTIMATED** from crude spot × 7.33 bbl/MT (crude-equivalent energy conversion). This is *not* a VLSFO assessment; VLSFO trades at a refined-product spread to crude | ⚠️ Replace with a licensed bunker assessment (e.g. Ship & Bunker) or customer-supplied actuals before contract-grade use |
| **Freight-market series** | `ml/datasets/processed_freight_training_data.csv` | Breakwave Dry Bulk Shipping ETF (NYSE Arca: **BDRY**) — an ETF proxy for dry-bulk freight futures. **Not** the Baltic Exchange Baltic Dry Index; this platform makes no claim to redistribute Baltic data | ⚠️ ETF quotes are public but Yahoo-served (ToS). The Baltic Dry Index itself requires a negotiated display/redistribution licence from Baltic Exchange Information Services if ever used |
| **`ml/datasets/historical_prices.csv`** | ML training scripts only | Provenance undocumented | 🔴 **Do not ship** in a commercial product until provenance is established; excluded from the API runtime |
| **Weather (5-day port forecast)** | frontend → Open-Meteo | Open-Meteo API | ⚠️ Free tier is **non-commercial only**; buy their paid plan (~€29+/mo entry, verify current pricing) before any paid deployment |
| **Model evaluation report** | `ml/reports/model_performance_evaluation.json` | Produced by `ml/evaluate_ml_models.py` from the above datasets | ✅ Own artifact (input-data caveats above apply) |

## 3. What Must Be Licensed Before Charging Customers (checklist)

1. **Open-Meteo commercial plan** (or swap the weather provider) — cheapest and most urgent.
2. **Market-data decision** (one of):
   - License Baltic Exchange data via Baltic Exchange Information Services (quote required; lead time is real), **or**
   - Use customer-supplied rate/index data (customer warrants their own license), **or**
   - Build signals solely from owned/self-derived inputs.
3. **FX feed**: ECB/central-bank reference rates are free with attribution — drop Yahoo for FX.
4. **Bunker assessments**: commercial feed (Ship & Bunker or similar) or customer actuals.
5. Establish provenance or remove `ml/datasets/historical_prices.csv` from any distributed artifact.

## 4. History Note

Earlier versions of this repository cited route distances as "calibrated to Sea-Distances.org tables" and hire rates as "representative of Clarksons Research 2024 ranges", and labeled the BDRY ETF as the "Baltic Dry Index". All of those attributions have been removed: the distances are now produced by the project's own documented method (`shared/derive_distances.py` — which, cross-checked against public lane references, is *more* realistic than the previous hardcoded table), the hire rates are presented as editable assumptions, and the ETF is labeled accurately throughout.
