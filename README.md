# 🚢 SAIL Intelligent Freight Procurement & Maritime Decision Terminal

> **Steel Authority of India Limited (SAIL) | Ministry of Steel Bulk Import Freight Optimization**  
> *An industrial-grade maritime procurement intelligence platform, vessel-port physical constraint matching engine, and multi-horizon market decision support terminal.*

---

## 📌 1. What the Platform Does

The **SAIL Intelligent Freight Procurement Terminal** is an enterprise decision-support platform engineered for raw material bulk ocean logistics (Coking Coal, Thermal Coal, Iron Ore Pellets, and Limestone) imported from major global export hubs (*Newcastle, Hay Point, Samarinda, Maputo, New Orleans, Vladivostok*) to Indian East Coast discharge ports (*Paradip, Haldia, Vizag, Dhamra*).

The platform addresses three core maritime procurement challenges:
1. **Physical Vessel-Port Compatibility**: Prevents catastrophic chartering mistakes by strictly enforcing port draft constraints (e.g. blocking Capesize vessels from the 8.5m shallow river channel at Haldia port).
2. **Total Landed Cost Optimization**: Calculates comprehensive landed freight costs per metric tonne ($/MT) by integrating daily charter hire rates, bunker fuel consumption, port charges, canal fees, and demurrage risk buffers.
3. **Market Timing Intelligence**: Evaluates forward Baltic Dry Index trends to determine optimal tender release timing (**HOLD / WAIT** vs **CHARTER NOW**) and provides an interactive what-if simulator to stress-test scenarios against fuel shocks and market swings.

---

## 🏗️ 2. System Architecture

The platform features a **dual-mode architecture**:
- **Standalone Web Terminal (Vercel-Ready)**: The React 18 + TypeScript + Vite frontend contains a 100% faithful client-side port of the deterministic procurement engine and precomputed forecast models. It deploys to Vercel with **zero backend dependencies or cold-start latency**.
- **Modular Flask REST API (Optional Backend)**: A clean Python Flask service in `backend/` that provides live market scrapers (`yfinance`), time-series forecast endpoints, and validation audits. The frontend automatically detects and routes to the Flask API if available, gracefully falling back to the client-side engine if running in standalone mode.

```
SIH-SAIL/
├── frontend/                     # React + TypeScript + Vite (Vercel-Ready)
│   ├── src/
│   │   ├── components/           # Terminal UI (Executive Hero, Vessel Table, Maps, Charts)
│   │   ├── data/                 # Bundled precomputed forecasts, citations, audit data
│   │   ├── lib/                  # procurementEngine.ts (1:1 TypeScript domain logic)
│   │   ├── services/             # api.ts (Dual-mode live/fallback client service)
│   │   └── styles/               # index.css (Industrial maritime terminal styling)
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Modular Flask REST API
│   ├── app/
│   │   ├── routes/               # Clean REST endpoints (/api/health, /api/procurement, etc.)
│   │   ├── services/             # Domain bridges & live market scrapers
│   │   └── __init__.py           # Flask app factory with CORS handling
│   ├── tests/                    # API integration test suite (9/9 passing)
│   ├── requirements.txt
│   └── run.py                    # Server startup script
│
├── procurement/                  # Core Domain Procurement Engine
│   ├── procurement_engine.py     # Draft limits, vessel specs, landed cost formulas
│   └── tests/
│       └── test_procurement_engine.py # Unit tests (5/5 passing)
│
├── ml/                           # ML Training, Auditing & Evaluation
│   ├── evaluate_ml_models.py     # 4-model evaluation engine
│   ├── model_honesty_check.py    # Zero-ML naive persistence audit script
│   ├── freight_pipeline.py       # Market ingestion pipeline
│   ├── datasets/                 # Master training and historical CSVs
│   └── reports/                  # Evaluation JSON and confusion matrix heatmaps
│
├── docs/                         # Engineering & Scientific Documentation
│   ├── MODEL_HONESTY_REPORT.md   # Deep-dive on ML metrics, naive baseline & classifier status
│   ├── ARCHITECTURE.md           # Full architectural and deployment guide
│   └── DATA_PROVENANCE.md        # Provenance audit and source disclosures
│
├── .gitignore
└── README.md
```

---

## 🎨 3. UI/UX Philosophy

The interface is intentionally designed as an **Industrial Maritime Command Terminal** (reminiscent of a port authority operations room or commodity trading desk) rather than a generic AI dashboard:
- **Restrained Maritime Palette**: Deep slate `#060911`, steel borders `#1a273c`, ocean-sky `#38bdf8`, signal-amber `#f59e0b`, safe-green `#10b981`, and infeasible-red `#ef4444`.
- **Information Density**: Monospace typography for coordinates, nautical miles, bunker values, and landed cost rates (`font-mono`).
- **Physical Feasibility Prominence**: Physical draft violations are highlighted with high-contrast **`🔴 INFEASIBLE`** markers before economic rank.
- **Judge Demo Mode**: One-click preset locking the optimal Australian Metallurgical Coal shipment (Newcastle $\to$ Paradip, 75K MT Panamax) for rapid competition demonstration.

---

## 🏷️ 4. Data Provenance & Source Transparency

Every metric in the terminal is tagged with an unambiguous provenance badge:
- **`LIVE`**: Retrieved in real-time during the active session (e.g. Open-Meteo 5-day weather API, live USD/INR or Crude spot).
- **`HISTORICAL`**: Empirical historical series (2021–Present Baltic Dry Index $BDRY$, historical bunker records).
- **`ESTIMATED`**: Values computed using calibrated industry formulas (bunker price from crude $CL=F \times 7.33$, landed cost per MT, 95% forecast bounds).
- **`BENCHMARK`**: Published standard references (Clarksons Research 2024 spot dry bulk ranges, Sea-Distances.org nautical tables, Indian Major Ports Authority berth draft guidelines).
- **`DEMO`**: Pre-configured competition walkthrough preset.

*For full details, see [docs/DATA_PROVENANCE.md](docs/DATA_PROVENANCE.md).*

---

## 🔬 5. Machine Learning Methodology & Honest Limitations

Unlike systems that fabricate "95% AI accuracy," our models were audited against **zero-ML naive persistence baselines**:

| Model | Task | Test $R^2$ / Acc | Naive Baseline | Status & Disclosure |
|:---|:---|:---:|:---:|:---|
| **Freight RF Regressor** | BDRY Index | $R^2 = 0.953$ | $R^2 = 0.972$ | 🟡 **Well-Fitted / Autocorrelation**: Does not beat naive persistence ($t-1$ moving average). Presented as an experimental trend corridor. |
| **Freight GB Regressor** | BDRY Index | $R^2 = 0.952$ | $R^2 = 0.972$ | 🟡 **Well-Fitted / Autocorrelation**: Does not beat naive persistence. Displayed with explicit 95% uncertainty bands. |
| **VLSFO Bunker Regressor**| Fuel Price | $R^2 = 0.779$ | $R^2 = 0.854$ | 🟢 **Well-Fitted**: Regularized Ridge prevents parameter explosion. |
| **Charter Action Classifier**| 3-Class Signal | Acc: `56.2%` | Majority: `56.2%` | 🔴 **Majority Class Collapse**: Confusion matrix reveals 100% predictions for "CHARTER NOW" (Macro F1: 0.24). **Excluded from autonomous execution; decisions are driven by transparent rate deltas.** |

*For complete confusion matrices and scientific justifications, see [docs/MODEL_HONESTY_REPORT.md](docs/MODEL_HONESTY_REPORT.md).*

---

## 🚀 6. Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on v25.2.1) & npm
- **Python**: v3.10+ (tested on Python 3.12)

### A. Run the Frontend (Vercel-Ready Web Terminal)
```bash
cd frontend
npm install
npm run dev
```
> Terminal opens at `http://localhost:5173`. Works standalone with zero configuration.

To test the optimized production build:
```bash
cd frontend
npm run build
npm run preview
```

### B. Run the Modular Flask REST API (Optional Backend)
```bash
python backend/run.py
```
> Flask REST server starts at `http://localhost:5000` with universal CORS enabled.

---

## 🧪 7. Running Tests & Audits

### 1. Core Procurement Domain Tests
```bash
python -m unittest procurement/tests/test_procurement_engine.py
```
> Validates port draft constraints (e.g. Haldia river limit), vessel ranking, boundary inputs, and cost calculations (5/5 tests passing).

### 2. Flask REST API Integration Tests
```bash
python -m unittest backend/tests/test_api.py
```
> Validates all REST endpoints, health check, CORS headers, and error handling (9/9 tests passing).

### 3. Machine Learning Evaluation & Honesty Check
```bash
python ml/evaluate_ml_models.py
python ml/model_honesty_check.py
```
> Evaluates all 4 ML models, generates 3x3 confusion matrix heatmaps, and outputs the zero-ML naive baseline audit.

---

## 📱 8. Relationship to Mobile Application

The SAIL SIH initiative consists of two separate, coordinated solutions:
1. **Mobile Application (Android / Kotlin)**: Dedicated to mobile field logistics, captain and port agent status updates, and push notifications.
2. **Web Intelligence Platform (This Repository)**: Serves as the **Executive Procurement Command Center** for procurement teams at SAIL headquarters to simulate what-if scenarios, optimize landed vessel costs, and plan strategic chartering tenders.

---

## 🌐 9. Deployment Strategy

- **Vercel (Frontend)**: Connect repository, set root directory to `frontend`, framework to `Vite`, build command to `npm run build`, and deploy.
- **Python Host (Backend)**: Deploy `backend/run.py` to Render, Railway, or AWS. Set `VITE_API_URL` on Vercel to connect frontend to backend.
