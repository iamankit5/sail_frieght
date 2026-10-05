# Commercialization Plan — Bulk Freight Procurement Platform

> Status: v1.0 · October 2026 · Companion documents: [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_PROVENANCE.md](DATA_PROVENANCE.md), [MODEL_HONESTY_REPORT.md](MODEL_HONESTY_REPORT.md)

This document is the complete plan for converting the SIH hackathon prototype into a product that can legally and credibly be sold to commercial buyers. It is based on a full engineering audit of this repository (October 2026) and market research on the dry-bulk freight software landscape.

---

## 1. The Problem (and why it is commercially real)

India is the world's second-largest crude steel producer and imports **~85% of its coking coal** — about 56 million tonnes in FY23, worth roughly **₹1.53 lakh crore (~US$18B)**, primarily from Australia and the US. Ocean freight is one of the largest variable cost lines in that landed cost, and it is procured through a process that is still largely broker-phone-and-spreadsheet:

- **Vessel–port physical mismatch** is a real, expensive failure mode (e.g. chartering a vessel whose draft exceeds the receiving channel; Haldia's ~8.5 m river channel excludes all Capesize tonnage).
- **Landed-cost blindness**: buyers compare headline freight rates without a rigorous voyage-level TCO (hire, bunkers, port charges, canal, demurrage risk).
- **Timing risk**: tender release timing against freight-market cycles is done on intuition.

Steel PSUs and large private mills have procurement teams for this; **mid-size importers, trading houses, and smaller mills do not** — that is the underserved segment this product targets.

## 2. Competitive Landscape

| Tier | Players | What they sell | Pricing | Gap they leave |
|:---|:---|:---|:---|:---|
| Enterprise voyage ops | Veson Nautical (IMOS/IMOS X), ION Group Softmar | Full voyage management for owners/operators | Six-figure annual contracts, opaque | Priced and shaped for shipping companies, not cargo owners |
| Data & benchmarking | Clarksons Research, Baltic Exchange, Xeneta | Rate indices, benchmarks, crowdsourced contract data | Enterprise subscriptions | Data, not decision workflow; per-seat costs are high |
| Free calculators | VoyBulk, TheFreight, distance calculators | One-off voyage/TCE estimates | Free/freemium | No India lane focus, no port-constraint enforcement, no procurement workflow |

**Positioning:** a *cargo-owner-side* (not ship-owner-side) freight decision terminal for Indian bulk importers — physical feasibility enforcement, voyage-level landed cost, and tender-timing support on the specific corridors that matter (Australia/Indonesia/Mozambique/US → East Coast India). None of the tier-1 platforms sells exactly this to this buyer at a mid-market price.

**Honest differentiation warning:** the current cost model uses *public-benchmark-calibrated* assumptions, not proprietary data. The durable moat must be built from: (a) licensed or proprietary market data, (b) India-lane port constraint knowledge maintained over time, and (c) workflow lock-in (tender history, quote tracking). This is a **workflow product first, data product second** — see §5.

## 3. Data Licensing — the legal gate (must be resolved before charging anyone)

The audit found the product's core numbers currently reference unresellable sources. Status and strategy per data item:

| Data | Current state (repo) | Commercial legality | Strategy |
|:---|:---|:---|:---|
| Vessel daily hire rates | "Calibrated to Clarksons Research 2024 spot benchmarks" | Clarksons data is subscription-licensed; deriving and reselling values from their published ranges without a license is not defensible | Present rates as **configurable market assumptions owned by the customer** (they are negotiators with broker access); optionally license a feed later |
| Sea route distances | "Calibrated to Sea-Distances.org tables" | Copyrighted commercial tables | **Self-derived**: great-circle (haversine) distance between port coordinates × published routing detour factors, with the methodology documented. Physical facts + transparent method = defensible |
| Freight market series | Yahoo `BDRY` ticker, labeled "Baltic Dry Index" | (a) Yahoo ToS prohibits commercial redistribution; (b) BDRY is actually the **Breakwave Dry Bulk Shipping ETF**, not the BDI; (c) the BDI itself requires a Baltic Exchange display/redistribution license (negotiated, not published) | Correct the labeling everywhere; treat any index as a pluggable provider. Before charging customers: license Baltic data **or** use customer-supplied data **or** build signals from own inputs only |
| Bunker prices | Derived as crude (`CL=F`) × 7.33 | Yahoo ToS issue + the derivation is economically wrong (crude $/bbl × 7.33 is crude in $/MT, not VLSFO, which trades at a refined-product spread) | Pluggable provider; candidates: Ship & Bunker commercial feed, or customer-supplied actuals; fix or drop the ×7.33 presentation |
| Weather (port delay risk) | Open-Meteo | Free tier is **non-commercial only**; commercial use requires their paid plan (~€29+/mo entry, verify current pricing) | Paid plan before any paying customer; it is trivially cheap |
| `ml/datasets/historical_prices.csv` | Unknown provenance | Untested ownership | **Do not ship in a commercial product** until provenance is established; replace with customer/licensed data |
| Port draft limits / berth data | Public port authority notices | Public facts | Fine; keep citing the authority and the date checked |

**Rule adopted in this codebase going forward:** every number the engine uses is either (1) a customer-configurable assumption, (2) self-derived with a documented method, or (3) from a source with a commercial license on file. Provenance badges (`LIVE/HISTORICAL/ESTIMATED/BENCHMARK`) stay — they are a genuine selling point.

## 4. Engineering Gaps (from the audit) and their fixes

### Deal-breakers (fixed in this pass unless noted)

1. **Security posture**: Flask debugger enabled by default on `0.0.0.0` (remote code execution via Werkzeug console), CORS `Access-Control-Allow-Origin: *` on every response, no authentication, no rate limiting, internal exception text returned to clients, NaN/Infinity accepted by the evaluate endpoint.
   → Fix: debug off by default + production WSGI entrypoint; configurable CORS allowlist; API-key authentication (per-tenant keys, env-managed); request validation with 400s; rate limiting; sanitized errors with server-side logging.
2. **Fabricated-data fallback**: the forecast service silently serves invented market history on any error — disqualifying for a procurement tool.
   → Fix: fail loudly with a clear error; synthetic data only behind an explicit `DEMO_MODE=1` flag and labeled as such.
3. **Trust bugs in the UI**: the recommendation hero card showed "Physical: Cleared" even when every vessel was draft-infeasible (e.g. Haldia); evaluation errors were swallowed behind an infinite spinner; the init effect refetched everything on every slider tick.
   → Fix: feasibility-first recommendation logic, error surfacing, effect discipline.
4. **Engine integrity**: canal fees charged on canal-less lanes (Australia→India); unknown cargo types silently priced as coking coal; emoji strings used as logic keys; two engine copies (TS + Python) that can drift.
   → Fix: canal-fee only on true canal lanes; unknown cargo → 400; enum risk levels; engine **parameters** single-sourced in a shared JSON consumed by both Python and TypeScript, with a parity test.

### Commercial necessities (roadmap, not in this pass)

5. **Multi-tenancy and persistence**: user accounts (OIDC or email+password), organizations, per-tenant configuration (ports, negotiated rates, cargo profiles), saved scenarios, tender history, audit log. Requires a database (PostgreSQL) and a real auth provider.
6. **Billing and licensing**: Stripe/Razorpay subscriptions or annual invoices; license enforcement via API keys with seat/quota limits.
7. **Operations**: production hosting with SLA (replace free-tier Render + keep-alive cron), structured logging, error tracking (Sentry), monitoring, backups, status page.
8. **Compliance**: India DPDP Act 2023 (processor contracts under Sec 8(2), breach notification, data minimization) ahead of the ~May 2027 enforcement window; ISO 27001/SOC 2 when enterprise buyers ask; written MSME/company registration, GST, and standard MSA + SLA templates.
9. **ML posture**: the honest audit showed no regressor beats a naive persistence baseline and the classifier collapses to majority class. Keep the transparency (it builds trust), de-emphasize "AI score" branding, and reframe ML as R&D: rule-based, explainable decision logic is the product today.

## 5. Product Roadmap

**v1.0 — "Sellable" (this pass):** single-tenant deployment per customer (or shared SaaS with API-key tenancy), hardened API, legal data posture, corrected UI, CI, honest docs. Deployable for a paid pilot.

**v1.1 — Pilot-ready (4–8 weeks):** customer configuration store (their ports, their negotiated rates, their cargo profiles), saved scenarios + PDF export for tender files, user accounts, deployed on proper hosting with monitoring.

**v1.2 — Repeatable SaaS (3–6 months):** multi-tenant database, billing, tender/quote tracking workflow (the lock-in feature), email digests, licensed or customer-supplied market feeds, DPDP-compliant data agreements.

**v2.0 — Defensibility (6–12+ months):** actuals feedback loop (record final fixture + invoice vs estimate → calibrated, proprietary landed-cost model), port congestion intelligence from AIS data (AIS is public-domain via IMO/Lloyd's-listed providers with licenses), integration hooks (ERP/procurement systems).

## 6. Target Customers & Pricing (to validate in pilots)

Primary: mid-size steel mills and coking-coal/thermal-coal importers on India's east coast; commodity trading houses; large PSU procurement wings (via pilot engagements).

| Plan | Target | Price point (indicative) | Contents |
|:---|:---|:---|:---|
| Pilot | 1 procurement desk, 3 months | ₹2–5L one-off | Deployment, config, support, success review |
| Pro | Growing importer, per-seat | ₹40k–1L / user / month (US$500–1,200) | Full terminal, saved scenarios, support SLA |
| Enterprise | Mills/trading houses | ₹15–40L / year | Multi-user, custom config, data feed integration, on-prem option |

Benchmark sanity: this undercuts Veson/ION by an order of magnitude while being far more workflow-specific than free tools. Pricing must be validated against willingness-to-pay in the first 3–5 pilot conversations; anchor conversations on **cost of one bad charter** (a draft-infeasible fixture or mis-timed tender easily costs $100k+).

## 7. Go-to-Market

1. **Pilot funnel via the SIH/SAIL connection**: a documented, referenceable deployment is worth more than the first invoice. Ask for a letter of result/endorsement.
2. **Direct outbound** to chartering/procurement heads at mid-size importers (east coast cluster: Paradip, Dhamra, Vizag, Haldia catchment) with a corridor-specific ROI one-pager.
3. **Content/SEO**: publish the honest methodology (great-circle + detour factors, TCO breakdown) — transparency is the wedge against black-box incumbents.
4. **Partnership option**: white-label to freight forwarders/ship brokers who already own importer relationships.

## 8. What Was Fixed in the Codebase (this pass)

- Security hardening: debug off by default, gunicorn production entrypoint, configurable CORS, API-key auth + rate limiting, strict input validation (NaN/Infinity/unknown cargo/unknown port → 400), no internal error leakage, request logging.
- Data legality scrub: all Clarksons/Sea-Distances/"Baltic Dry Index" attributions removed or corrected; distances re-derived as great-circle × documented detour factors; BDRY correctly identified as the Breakwave ETF; data provenance document rewritten as a licensing checklist.
- Engine integrity: canal fees only on canal lanes, unknown cargo rejected, enum risk levels, shared single-source engine config (`shared/engine_config.json`) consumed by both Python and TypeScript, engine parity test.
- Forecast service: no fabricated fallback data (explicit demo mode instead), thread-safe expiring caches, outbound timeouts, `datetime.utcnow` fixed.
- Frontend: feasibility-first recommendation hero (no more "Cleared" on infeasible ports), error surfacing instead of infinite spinners, refetch storm fixed, dead files removed, env-configurable API URL, hackathon branding removed.
- Hygiene: stale root-level script duplicates and stray artifacts deleted, requirements consolidated and pinned, CI workflow (backend tests + frontend build), `.env.example`, README/docs updated with true test counts.

## 9. Immediate Next Actions (owner checklist)

1. Form/regularize a legal entity; standard MSA + DPDP processor agreement templates from a lawyer.
2. Buy Open-Meteo commercial plan (or swap weather provider) before any paid deployment.
3. Decide the market-data play for v1.2 (Baltic license quote vs customer-supplied vs own-signal) — request a Baltic Exchange Information Services quote now; lead times are real.
4. Run 3–5 pilot conversations using §6 pricing as the hypothesis; instrument willingness-to-pay.
5. Replace the free-tier hosting with a paid instance + Sentry once the first pilot is signed.
