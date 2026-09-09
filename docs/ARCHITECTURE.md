# SAIL Freight Intelligence Platform — System Architecture & Engineering Guide

> **Enterprise Architecture for SIH 2026 Bulk Maritime Procurement Decision Support**

---

## 1. High-Level Architecture Overview

The SAIL Freight Intelligence Platform is built on a **resilient dual-mode architecture** designed to operate either as a high-performance **Vercel-deployable standalone web application** or connected to an optional **modular Flask REST API**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SAIL MARITIME INTELLIGENCE PLATFORM                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────────┐               ┌───────────────────────────────────┐
│     CLIENT BROWSER (VERCEL)       │               │      FLASK REST API (OPTIONAL)    │
│  React 18 + TypeScript + Vite     │               │           Python / Flask          │
├───────────────────────────────────┤               ├───────────────────────────────────┤
│ • Executive Decision Matrix       │   HTTP / REST │ • /api/health                     │
│ • Vessel Matching & Draft Filter  │ ────────────> │ • /api/procurement/evaluate       │
│ • Interactive SVG Corridor Chart  │ (if available)│ • /api/market/latest (yfinance)   │
│ • 5-Day Real-Time Open-Meteo API  │               │ • /api/forecast/freight           │
│ • What-If Scenario Stress-Tester  │ <──────────── │ • /api/models/evaluation          │
│ • Deterministic Engine Fallback   │   JSON data   │                                   │
└───────────────────────────────────┘               └───────────────────────────────────┘
            │                                                         │
            ▼                                                         ▼
┌───────────────────────────────────┐               ┌───────────────────────────────────┐
│     CLIENT-SIDE ENGINE (TS)       │               │       ML & DOMAIN ENGINE (PY)     │
│  procurementEngine.ts             │               │   procurement/ & ml/              │
├───────────────────────────────────┤               ├───────────────────────────────────┤
│ • 100% Mathematical Port          │               │ • procurement_engine.py           │
│ • Port Draft Constraints          │               │ • evaluate_ml_models.py           │
│ • Clarksons 2024 Benchmarks       │               │ • freight_pipeline.py             │
│ • Sea-Distances Nautical Tables   │               │ • model_honesty_check.py          │
│ • Zero External Runtime Blocker   │               │ • Unit Test Suites (5/5 & 9/9)    │
└───────────────────────────────────┘               └───────────────────────────────────┘
```

---

## 2. Component Design & Responsibilities

### A. Frontend (`frontend/`)
- **Technology Stack**: React 18, TypeScript, Vite, TailwindCSS / Custom Industrial CSS tokens.
- **Visual Identity**: Maritime Logistics + Industrial Procurement + Commodity Trading Terminal (deep navy `#060911`, steel borders `#1a273c`, ocean-blue `#0284c7`, caution-amber `#f59e0b`, safe-green `#10b981`, infeasible-red `#ef4444`).
- **Resilient Fallback Service (`api.ts`)**: Automatically attempts to fetch live data from the Flask API (`/api/...`). If the backend server is not running (e.g. static hosting on Vercel), it silently falls back to the deterministic client-side engine and precomputed model datasets without any user disruption or broken views.
- **External Public Feeds**: Real-time 5-day weather is queried directly from Open-Meteo API without requiring any private API keys.

### B. Backend (`backend/`)
- **Technology Stack**: Python, Flask, Pandas, NumPy, yfinance, requests.
- **Replaced Legacy Architecture**: Completely replaces the monolithic Streamlit prototype (`app.py`) and the messy FastAPI microservice with a modular Flask service (`app/routes/`, `app/services/`).
- **Endpoints**:
  - `GET /api/health`: Service health and timestamp.
  - `POST /api/procurement/evaluate`: Landed-cost calculation and vessel feasibility matching.
  - `GET /api/procurement/ports`: Port coordinates, draft constraints, and citations.
  - `GET /api/procurement/routes`: Nautical distances table.
  - `GET /api/market/latest`: Live market sync from `CL=F` crude and `USDINR=X` with benchmark fallback.
  - `GET /api/forecast/freight`: Multi-horizon 30-day forward projections with 95% confidence intervals.
  - `GET /api/models/evaluation`: Validated ML metrics and confusion matrix datasets.

### C. Core Procurement Engine (`procurement/`)
- **File**: `procurement/procurement_engine.py`
- **Safety Enforcement**: Enforces destination port draft limits (Haldia 8.5m river restriction vs Dhamra 18.0m deepwater berth). Vessels exceeding depth are flagged as `🔴 INFEASIBLE: Draft Exceeds Limit` rather than simply receiving a lower economic score.
- **Unit Testing**: Verified by `procurement/tests/test_procurement_engine.py` (5/5 tests passing).

### D. Machine Learning & Auditing (`ml/`)
- **Files**: `evaluate_ml_models.py`, `model_honesty_check.py`, `freight_pipeline.py`, `baseline_model.py`.
- **Data Sets**: `processed_freight_training_data.csv`, `historical_prices.csv`.
- **Reports**: `model_performance_evaluation.json`, `confusion_matrix/`.
- **Transparency Audit**: Benchmarks regressors against zero-ML naive persistence baselines and exposes the chartering classifier majority-class collapse.

---

## 3. Directory Layout

```
SIH-SAIL/
├── frontend/                     # React + TypeScript + Vite web app (Vercel-ready)
│   ├── src/
│   │   ├── components/           # Modular UI (layout, procurement, vessel, route, etc.)
│   │   ├── data/                 # Bundled precomputed forecasts, benchmarks, audit data
│   │   ├── lib/                  # procurementEngine.ts (1:1 TypeScript domain logic)
│   │   ├── services/             # api.ts (Dual-mode live/fallback client service)
│   │   ├── styles/               # index.css (Industrial terminal theme)
│   │   ├── types/                # Strict TypeScript interface contracts
│   │   ├── App.tsx               # Main application shell
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Modular Flask REST API
│   ├── app/
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Procurement, market, and forecast services
│   │   └── __init__.py           # Flask app factory with universal CORS
│   ├── tests/                    # API integration tests (9/9 passing)
│   ├── requirements.txt
│   └── run.py                    # Server startup script
│
├── procurement/                  # Preserved Core Procurement Domain Logic
│   ├── procurement_engine.py     # Port limits, vessel specs, landed cost formulas
│   └── tests/
│       └── test_procurement_engine.py # Unit tests
│
├── ml/                           # ML Training, Auditing & Evaluation
│   ├── evaluate_ml_models.py     # 4-model evaluation script
│   ├── model_honesty_check.py    # Zero-ML baseline audit script
│   ├── freight_pipeline.py       # Market ingestion pipeline
│   ├── datasets/                 # Training and historical CSV datasets
│   └── reports/                  # Evaluation JSON and confusion matrix PNGs
│
├── docs/                         # Transparent Engineering Documentation
│   ├── MODEL_HONESTY_REPORT.md   # Scientific ML evaluation audit
│   ├── ARCHITECTURE.md           # This document
│   └── DATA_PROVENANCE.md        # Provenance audit and source citations
│
├── .gitignore
└── README.md
```

---

## 4. Deployment Instructions

### Option 1: Frontend-Only Deployment on Vercel (Recommended & Zero Configuration)
The React application contains the complete deterministic procurement engine and precomputed forecast models, allowing it to run 100% standalone on Vercel without requiring a serverless Python backend.

1. Connect the GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

### Option 2: Full-Stack Deployment (Vercel Frontend + Flask Backend)
If live server-side market scraping via `yfinance` is desired:
1. Deploy `backend/` to any standard Python container host (Render, Railway, Fly.io, or AWS ECS):
   ```bash
   python backend/run.py
   ```
2. In Vercel, set the environment variable:
   ```env
   VITE_API_URL=https://your-flask-backend-url.com
   ```
3. The frontend will automatically route requests to the live Flask API while maintaining the client-side fallback.

---

## 5. Relationship to Mobile Application

The SAIL SIH project features two distinct, complementary repositories:
1. **Mobile Application (Android / Kotlin)**: Dedicated to on-the-go operational notifications, captain/port agent field updates, and status checks.
2. **Web Intelligence Platform (This Repository)**: Designed as the **Procurement Command Center** for procurement officers, chartered accountants, and maritime supply chain directors at SAIL headquarters to simulate what-if scenarios, optimize multi-vessel landed costs, and evaluate forward market timing.
