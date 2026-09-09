# SIH SAIL Website — Anti-Gravity Master Refactor & UI/UX Prompt

## Mission

You are working on the **website repository** for the SIH 2026 SAIL Freight Intelligence project.

There is a separate Android/mobile repository for the same project. The mobile app is considered **DONE** for the current milestone. This repository is the **web application** and should become the polished, judge-facing web experience.

Your job is NOT to blindly rewrite the project.

Your job is to:

1. Inspect the existing repository thoroughly.
2. Preserve working domain logic, data, formulas, tests, datasets, and validated behavior.
3. Replace the current Streamlit UI with a proper React frontend.
4. Determine whether a backend is actually necessary.
5. Prefer a Vercel-deployable frontend-only architecture when technically safe.
6. If a backend is genuinely required, migrate the backend to Flask and deploy it separately.
7. Make the product feel like a serious maritime procurement intelligence product — NOT a generic AI dashboard.
8. Organize the repository into a clean production-style structure.
9. Improve UI/UX substantially without changing the underlying business meaning.
10. Never fabricate data, model accuracy, live status, vessel availability, or capabilities.

---

# 1. FIRST RULE: AUDIT BEFORE MODIFYING

Do not start rewriting files immediately.

First inspect:

- all Python files
- all React/JavaScript/TypeScript files, if any
- Streamlit code
- FastAPI code
- procurement engine
- forecasting pipeline
- bunker predictor
- datasets
- model artifacts
- tests
- evaluation JSON
- configuration files
- `.env` / `.env.example`
- requirements
- package manifests
- README
- generated reports
- charts
- static assets
- existing deployment configuration
- Git history if useful for understanding intent

Create an internal map of:

### Core domain logic that must be preserved

- vessel-port matching
- port draft constraints
- vessel class/capacity logic
- cargo quantity validation
- landed-cost calculation
- route distance logic
- vessel ranking
- freight forecasting
- bunker forecasting
- charter timing logic
- weather intelligence
- market-data retrieval
- data provenance
- what-if calculations
- validation tests

Do NOT rewrite working domain logic merely because the frontend is changing.

---

# 2. ABSOLUTE "DO NOT BREAK" LIST

These are the most important constraints.

## Do NOT break vessel safety logic

A vessel that physically cannot satisfy a destination port's draft constraint must never be presented as safely suitable just because it has a good economic score.

If the current engine represents infeasibility with a penalty, inspect it carefully and improve the presentation/decision layer so that physically incompatible vessels are explicitly marked:

> INFEASIBLE

rather than appearing as merely "less optimal."

Do not silently alter the underlying validated rules without understanding their tests.

---

## Do NOT break procurement calculations

Preserve the meaning of:

- cargo quantity
- vessel capacity
- vessel class
- vessel speed
- fuel consumption
- bunker cost
- charter hire
- port charges
- demurrage assumptions
- route distance
- landed cost
- ranking

If formulas are changed, document why and add/update tests.

---

## Do NOT fabricate ML performance

The current evaluation indicates that the forecasting components are still works in progress.

Known current limitations include:

- freight models do not currently beat the naive persistence baseline
- bunker forecasting also has limitations relative to the baseline
- the chartering classifier currently has a serious class-prediction problem and should NOT be represented as a highly accurate classifier

Do not turn weak metrics into marketing claims.

Do not write:

- "95% accurate"
- "AI guarantees savings"
- "predicts the market"
- "100% reliable"
- "production-grade AI"
- "perfect forecasting"

unless independently demonstrated by actual evaluation.

---

## Do NOT hide the classifier problem

The current chartering classifier evaluation has approximately:

- test accuracy: 56.23%
- macro precision: 18.74%
- macro recall: 33.33%
- macro F1: 0.24

The confusion matrix indicates that the classifier is effectively predicting the same class across the test set.

Do not cosmetically hide this.

The correct approach is to either:

1. fix/retrain/rebalance the classifier and validate it properly, OR
2. remove it from decision-critical UI and clearly present charter timing as a rule/signal-based or experimental intelligence component.

Do not label the current classifier "well fitted" merely because train/test gap is acceptable.

---

# 3. DATA HONESTY RULES

The application must distinguish between:

### LIVE

Data genuinely retrieved from an external live source during the current application session.

### HISTORICAL

Real historical data used for training or analysis.

### ESTIMATED

Values derived from real inputs using assumptions or conversion formulas.

### BENCHMARK

Typical maritime industry assumptions or published benchmark values that have not been individually verified for the exact route.

### DEMO / STATIC

Bundled data intentionally used for the prototype.

Every important market number should have enough context for a judge/user to understand where it came from.

Do not display a green "LIVE" badge just because a function exists that can theoretically retrieve data.

---

# 4. API KEYS / ENVIRONMENT

The current website does NOT require users to enter API keys for the current working experience.

Do NOT add an onboarding screen asking for:

- Gemini API key
- OpenAI API key
- weather API key
- market API key

unless the actual implementation genuinely requires one.

The `.env.example` file is a FUTURE integration hook.

It should not become part of the current setup instructions unless required.

Never expose secrets.

Never commit real `.env` credentials.

The repository should ignore:

- `.env`
- environment secrets
- Python cache
- build outputs
- IDE files
- local machine configuration

---

# 5. STREAMLIT → REACT MIGRATION

The current Streamlit interface is to be treated as the prototype UI.

Do NOT attempt to reproduce Streamlit visually.

Instead, extract the actual product concepts and rebuild them as a professional React application.

Recommended direction:

- React
- TypeScript
- Vite
- modern CSS / Tailwind if already appropriate
- reusable components
- client-side routing where useful
- clean state management
- charting library only where it improves comprehension
- accessible semantic HTML
- responsive layout

Avoid adding huge dependencies without a reason.

The frontend should be easy to deploy on Vercel.

---

# 6. BACKEND DECISION: DO NOT ADD ONE JUST BECAUSE "APPS HAVE BACKENDS"

Before migrating FastAPI to Flask, determine whether the website actually needs a server.

## Prefer FRONTEND-ONLY if all required functionality can safely run in the browser

A Vercel frontend-only architecture is preferred if:

- data can be fetched directly from public endpoints
- no secrets are required
- forecasting can consume precomputed model outputs
- procurement calculations can safely be implemented client-side
- datasets are small enough to bundle or fetch
- no protected database is required
- no server-only Python dependency is required
- no long-running model inference is required

If this works reliably, DO NOT create a Flask backend just for architecture aesthetics.

---

# 7. WHEN FLASK IS ACTUALLY REQUIRED

Use Flask only if inspection proves the browser cannot reasonably perform a required operation.

Examples:

- Python-only ML inference must happen at runtime
- Prophet/XGBoost model execution is required on demand
- private credentials must remain server-side
- large model artifacts should not be shipped to browsers
- server-side data processing is genuinely necessary
- database access must remain private
- long-running processing is required

If a backend is needed:

### Frontend

React + TypeScript + Vite

### Backend

Flask

### Backend responsibilities

Only server-side responsibilities.

For example:

- `/api/forecast`
- `/api/bunker`
- `/api/market`
- `/api/weather`
- `/api/procurement` if necessary

Do not turn Flask into a giant monolithic file.

Keep routes, services, domain logic, configuration, and data access separated.

---

# 8. IMPORTANT: DO NOT MIGRATE FASTAPI TO FLASK BLINDLY

The existing FastAPI bunker predictor should first be analyzed.

Determine:

- which endpoints the frontend actually uses
- which endpoints are redundant
- whether the frontend can consume precomputed results
- whether model inference must happen on the server
- whether Flask provides an actual deployment benefit
- whether Vercel serverless Python is practical for the exact model workload
- whether model startup time is acceptable

If the answer is:

> "We can eliminate the backend entirely without losing functionality or integrity"

then ELIMINATE IT.

That is preferable to maintaining unnecessary infrastructure.

If the answer is:

> "Python inference is genuinely needed"

then migrate the necessary API functionality to Flask and keep the backend minimal.

---

# 9. TARGET FOLDER ORGANIZATION

Organize the repository cleanly.

Preferred target structure:

```text
SIH-SAIL/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── navigation/
│   │   │   ├── procurement/
│   │   │   ├── vessel/
│   │   │   ├── route/
│   │   │   ├── weather/
│   │   │   ├── bunker/
│   │   │   ├── forecasting/
│   │   │   ├── simulator/
│   │   │   ├── charts/
│   │   │   └── provenance/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── data/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── data/
│   │   ├── utils/
│   │   └── __init__.py
│   ├── tests/
│   ├── requirements.txt
│   └── run.py
│
├── ml/
│   ├── freight_pipeline.py
│   ├── evaluate_ml_models.py
│   ├── model_honesty_check.py
│   ├── datasets/
│   ├── reports/
│   └── models/
│
├── procurement/
│   ├── procurement_engine.py
│   └── tests/
│
├── bunker-price-predictor/
│   └── ... only if still needed
│
├── docs/
│   ├── MODEL_HONESTY_REPORT.md
│   ├── ARCHITECTURE.md
│   └── DATA_PROVENANCE.md
│
├── .gitignore
├── README.md
└── ...
```

This is a target organization, not permission to blindly move files.

Preserve import behavior and tests while reorganizing.

If the backend is eliminated, remove the backend folder entirely rather than leaving dead infrastructure.

---

# 10. UI/UX MISSION

This is the most important design instruction.

The new website must NOT look like:

- generic SaaS dashboard
- generic AI dashboard
- ChatGPT clone
- "AI-powered" landing page full of glowing gradients
- random glassmorphism
- purple/blue gradient everywhere
- meaningless cards
- excessive rounded rectangles
- giant "AI" labels
- fake futuristic animations
- stock AI imagery
- decorative charts with no decision purpose

The visual identity should communicate:

> Maritime logistics + industrial procurement + financial intelligence + operational decision support.

Think:

- port control room
- shipping intelligence terminal
- professional commodity trading interface
- maritime operations center
- industrial procurement software

NOT:

> "AI startup landing page generated by an LLM."

---

# 11. DESIGN LANGUAGE

Create a distinctive visual system.

## Color philosophy

Use a restrained industrial palette.

Potential foundation:

- deep navy / near-black for primary surfaces
- off-white / warm neutral backgrounds
- muted steel tones
- restrained maritime blue
- one meaningful amber/orange accent for attention
- green only for genuine positive/live/safe states
- red only for genuine risk/infeasibility

Do not use gradients as the primary design language.

Do not use bright neon colors.

Do not use purple AI gradients.

---

# 12. TYPOGRAPHY

Typography should feel professional and information-dense.

Use:

- one strong display/heading family
- one highly readable UI/body family
- monospace/numeric styling selectively for market numbers, vessel specifications, timestamps, and technical values

Do not make every number huge.

Hierarchy should communicate importance.

---

# 13. INFORMATION ARCHITECTURE

The website should answer these questions in order:

### 1. What is happening?

Market / route / operational context.

### 2. What decision needs to be made?

Charter now, wait, or investigate.

### 3. Which vessels are actually feasible?

Physical constraints first.

### 4. What will it cost?

Landed cost and cost breakdown.

### 5. What could change the decision?

Weather, bunker price, freight trend, cargo quantity, route, vessel class.

### 6. How trustworthy is the information?

Live / historical / estimated / benchmark provenance.

This is much more meaningful than arranging random charts into a dashboard.

---

# 14. RECOMMENDED WEBSITE EXPERIENCE

Create a polished application shell.

## Header

Include:

- SAIL Freight Intelligence branding
- current operational/data timestamp
- data synchronization status
- navigation
- subtle system status indicator

Do not fill the header with unnecessary buttons.

---

# 15. HERO / EXECUTIVE OVERVIEW

The first screen should immediately communicate the decision.

Instead of:

> "Welcome to AI Freight Dashboard"

show something meaningful such as:

> **East Coast Chartering Intelligence**

Then contextual information:

- route
- cargo
- vessel requirement
- current freight signal
- bunker signal
- weather condition
- recommendation

The primary action should be obvious.

---

# 16. DECISION PANEL

Create a strong decision area.

Example conceptual hierarchy:

```text
CHARTER DECISION

Current Signal
WAIT / CHARTER / REVIEW

Why?
• Freight signal
• Bunker signal
• Vessel availability assumption
• Weather
• Cost exposure

Confidence / Data Quality
HISTORICAL + LIVE + ESTIMATED
```

Do not use fake confidence percentages if they are not statistically justified.

If the model is experimental, call it:

> Decision Signal

rather than:

> AI Confidence: 94%

---

# 17. VESSEL MATCHING EXPERIENCE

This should be one of the strongest screens.

A procurement officer should be able to:

1. choose origin
2. choose destination
3. enter cargo quantity
4. inspect candidate vessel classes
5. immediately see feasibility
6. compare landed cost
7. understand WHY a vessel ranks where it does

Use a professional comparison table/card hybrid.

Example conceptual fields:

- Vessel Class
- DWT
- Draft
- Port Compatibility
- Estimated Voyage
- Charter Cost
- Bunker Cost
- Port Cost
- Total Landed Cost
- Status

The UI should make **physical feasibility visually more important than price**.

---

# 18. ROUTE VISUALIZATION

The globe/map should not exist merely because it looks cool.

Use it to communicate:

- origin
- destination
- route
- distance
- estimated transit time
- weather context
- operational risk

If the map is decorative, remove unnecessary effects.

The route visualization should support the procurement decision.

---

# 19. WEATHER

Do not create a generic weather app card.

Connect weather to the route.

Show:

- destination conditions
- relevant route conditions
- severity
- operational interpretation

For example:

> Moderate conditions — no major route disruption indicated.

The user should understand why the weather matters.

---

# 20. BUNKER INTELLIGENCE

Make bunker forecasting visually understandable.

Show:

- current/derived bunker estimate
- historical movement
- forecast horizon
- uncertainty/confidence band
- model status
- provenance

Avoid a chart that simply goes:

> line goes up → AI prediction

Explain the decision implication.

---

# 21. FREIGHT FORECAST

The freight forecast should be honest.

Clearly distinguish:

- observed historical values
- forecast
- uncertainty
- baseline
- model status

If the model is not beating persistence, say so somewhere appropriate.

A polished dashboard can still show:

> Experimental forecast — currently below naive benchmark.

That is much stronger in a judge Q&A than hiding the weakness.

---

# 22. WHAT-IF SIMULATOR

This should feel like a real decision tool.

Inputs:

- cargo quantity
- vessel class
- route
- bunker assumption
- optional charter timing scenario

Outputs:

- total landed cost
- cost delta
- voyage duration
- feasibility
- major cost drivers

Use before/after comparisons.

Example:

```text
CURRENT SCENARIO
₹X / tonne

WHAT-IF
₹Y / tonne

DELTA
-₹Z / tonne
```

Make changes visually obvious.

---

# 23. PROVENANCE UI

This is a major differentiator.

Do not bury data provenance inside a footer.

Use small, consistent indicators:

- LIVE
- HISTORICAL
- ESTIMATED
- BENCHMARK
- DEMO

On hover/click, explain the source.

Example:

> Bunker estimate  
> Derived from live crude input using project conversion assumptions.

This is far better than pretending every value is equally reliable.

---

# 24. RESPONSIVE DESIGN

The web application must work properly on:

- desktop
- laptop
- tablet
- smaller screens

Do not simply shrink desktop cards.

Create meaningful responsive layouts.

The primary SIH demo is likely desktop, so optimize desktop first while maintaining mobile usability.

---

# 25. ANIMATION

Use animation only when it communicates state.

Good:

- smooth chart transitions
- route drawing
- panel transitions
- loading states
- subtle hover feedback
- status changes

Bad:

- floating blobs
- glowing AI particles
- endless gradients
- excessive parallax
- spinning icons everywhere

The product should feel calm and expensive.

---

# 26. ACCESSIBILITY

Implement:

- readable contrast
- keyboard navigation
- visible focus states
- semantic buttons
- meaningful labels
- tooltips where technical terminology needs explanation
- no information conveyed by color alone

Do not sacrifice usability for aesthetics.

---

# 27. ERROR STATES

Every external data request needs a useful failure state.

Bad:

> Error

Good:

> Market feed unavailable  
> Showing last validated estimate.  
> Data status: ESTIMATED

Never silently substitute data.

Never let a failed API request make the dashboard look like it has live data.

---

# 28. LOADING STATES

Do not use generic spinners everywhere.

Use skeletons or meaningful loading labels:

> Synchronizing market data...

> Calculating vessel feasibility...

> Loading route weather...

This reinforces what the system is doing.

---

# 29. PERFORMANCE

Avoid:

- huge bundles
- unnecessary animation libraries
- loading all datasets on initial page load
- repeatedly calculating expensive models in the browser
- unnecessary API calls

Use:

- lazy loading
- memoization where appropriate
- cached data
- efficient charts
- code splitting
- debounced simulator inputs

Do not optimize prematurely; measure first.

---

# 30. MOBILE APP RELATIONSHIP

The Android app is already complete.

Do NOT attempt to merge the Android application into this repository.

Do NOT rewrite the mobile app.

Do NOT duplicate the mobile implementation.

The web app should share the project's domain language and decision logic, but remain its own frontend.

The two repositories should be clearly presented as:

- Mobile Application
- Web Intelligence Platform

---

# 31. TESTING REQUIREMENTS

Before declaring the migration complete:

### Procurement

All existing procurement tests must pass.

### Vessel matching

All existing vessel matching tests must pass.

### Forecasting

Existing model evaluation scripts must still run.

### Frontend

Test:

- loading
- empty state
- API failure
- invalid cargo
- impossible vessel
- route change
- what-if changes
- responsive layout
- chart rendering

### Backend, if retained

Test:

- health
- forecast
- invalid requests
- unavailable data
- CORS
- error responses

---

# 32. GIT / REPOSITORY CLEANUP

Remove from version control:

```text
.env
__pycache__/
*.pyc
*.pyo
.idea/
.vscode/
.gradle/
build/
dist/
node_modules/
```

Do not delete useful datasets or model reports merely because they are large.

Before committing, inspect:

```text
git status
git diff
```

Ensure no credentials exist.

Search for:

- API keys
- tokens
- passwords
- private URLs
- service account JSON
- credentials

Never push secrets.

---

# 33. README AFTER MIGRATION

Rewrite the root README after the architecture is finalized.

It should explain:

1. What the platform does
2. Why it exists
3. Key capabilities
4. Architecture
5. UI/UX philosophy
6. Data provenance
7. ML methodology
8. Honest current limitations
9. How to run frontend
10. How to run backend, ONLY if backend exists
11. How to run tests
12. Deployment
13. Relationship to mobile application
14. Roadmap

Do not claim features that were removed during migration.

---

# 34. DEPLOYMENT STRATEGY

## Preferred

```text
React + Vite
      ↓
    Vercel
```

No backend if unnecessary.

## If backend is required

```text
React + Vite
      ↓
    Vercel
      ↓
    Flask API
      ↓
Python ML / data services
```

Use a sensible backend host compatible with Flask.

Do not force Flask into Vercel if that creates poor cold-start behavior for Prophet/XGBoost.

The deployment architecture should be selected based on actual runtime requirements.

---

# 35. FINAL QUALITY BAR

Before finishing, ask:

### Does this look like generic AI-generated UI?

If yes → redesign it.

### Does every major visual element communicate a decision?

If no → remove/rework it.

### Can a procurement officer understand the main recommendation within 10 seconds?

If no → improve hierarchy.

### Can a judge tell what is live vs estimated?

If no → improve provenance.

### Can a judge inspect the model limitations without finding misleading claims?

If no → fix the copy.

### Can the project run without unnecessary API configuration?

If yes → don't add it.

### Is a backend genuinely required?

If no → don't maintain one.

### If a backend is required, is it clean Flask rather than a half-migrated FastAPI system?

If no → finish the migration.

### Are existing validated calculations and tests still working?

If no → STOP and repair them before proceeding.

---

# 36. EXECUTION ORDER

Follow this exact broad order:

## Phase 1 — Audit

Inspect the complete repository.

Do not modify code yet.

Document:

- current architecture
- dependencies
- data flow
- frontend capabilities
- backend capabilities
- model dependencies
- deployment blockers
- tests
- technical debt

## Phase 2 — Decide architecture

Answer:

> Can this be frontend-only?

If yes:

- remove unnecessary backend dependency
- prepare Vercel deployment

If no:

- define minimal Flask API
- identify exact endpoints required

## Phase 3 — Protect domain logic

Before frontend migration:

- run tests
- record current behavior
- preserve procurement engine
- preserve datasets
- preserve model evaluation
- preserve provenance

## Phase 4 — Repository organization

Move files into logical directories.

Update imports and scripts.

Run tests after every significant move.

Do not move everything in one blind operation.

## Phase 5 — React foundation

Create the React + TypeScript + Vite application.

Build:

- application shell
- routing
- design tokens
- typography
- layout
- navigation
- reusable components
- state/data services

## Phase 6 — UI/UX redesign

Build the experience in this order:

1. Executive overview
2. Charter decision
3. Vessel matching
4. Route intelligence
5. Weather
6. Bunker intelligence
7. Freight forecasting
8. What-if simulator
9. Data provenance
10. Validation / methodology view

## Phase 7 — Data integration

Connect actual data.

Do not create fake placeholder numbers that resemble live data.

Use realistic empty/loading/error states.

## Phase 8 — Backend migration if needed

Only now migrate FastAPI → Flask if the audit proved it necessary.

Do not migrate unused endpoints.

## Phase 9 — Validation

Run:

- Python tests
- model audits
- frontend build
- lint/type checks
- backend tests if applicable
- manual UI walkthrough

## Phase 10 — Deployment

Deploy frontend.

If backend exists, deploy backend separately.

Test production URLs.

Verify CORS.

Verify data sources.

Verify that the application still behaves honestly in production.

## Phase 11 — Final cleanup

Remove:

- dead code
- unused dependencies
- duplicate files
- caches
- temporary files
- unused endpoints
- obsolete Streamlit files
- obsolete FastAPI files if migrated
- secrets
- misleading README claims

Then update the README.

---

# 37. CRITICAL PRINCIPLE

Do not confuse "more technology" with "better engineering."

If React + Vercel is enough:

**Use React + Vercel.**

If Python inference genuinely requires a server:

**Use React + Flask + an appropriate backend host.**

If Streamlit functionality can be replaced by client-side React:

**Replace it.**

If a model does not perform well:

**Expose the limitation instead of hiding it.**

If a vessel cannot berth:

**Block it instead of merely lowering its score.**

If data is estimated:

**Label it.**

If a visual does not help a procurement decision:

**Remove it.**

The goal is not to make the repository look complicated.

The goal is to make the system look like something a real SAIL procurement team could understand, challenge, and eventually build upon.

---

# 38. DEFINITION OF DONE

The task is complete only when:

- [ ] Streamlit UI is replaced by React
- [ ] React application builds successfully
- [ ] UI is responsive
- [ ] UI does not look like generic AI SaaS
- [ ] Visual hierarchy is decision-oriented
- [ ] Procurement logic is preserved
- [ ] Vessel feasibility logic is preserved/improved safely
- [ ] Existing tests pass
- [ ] ML evaluation remains reproducible
- [ ] No false accuracy claims exist
- [ ] Classifier limitations are handled honestly
- [ ] Live/estimated/historical data is clearly distinguished
- [ ] No unnecessary API keys are required
- [ ] `.env` is not committed
- [ ] Repository is organized
- [ ] Dead Streamlit code is removed
- [ ] FastAPI is removed ONLY if no longer needed
- [ ] Flask exists ONLY if a backend is genuinely necessary
- [ ] Frontend is Vercel-ready
- [ ] Backend, if required, is deployment-ready
- [ ] README reflects the final architecture
- [ ] Production build has been tested
- [ ] No secrets are present
- [ ] No critical domain behavior has been silently changed

---

# FINAL INSTRUCTION TO ANTI-GRAVITY

You are not being asked to "make the dashboard prettier."

You are being asked to transform an existing hackathon prototype into a **credible maritime procurement intelligence product**.

Preserve the engineering that already works.

Improve the engineering that genuinely needs improvement.

Do not fabricate.

Do not over-engineer.

Do not blindly migrate technologies.

Do not sacrifice domain correctness for visual polish.

And above all:

**Make the interface feel designed for people who make expensive shipping decisions — not people who want to see an AI demo.**
