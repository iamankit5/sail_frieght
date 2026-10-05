# Machine Learning — Model Honesty & Scientific Audit Report

> *Last updated: October 2026 · Regenerate with `python ml/evaluate_ml_models.py`*

---

## 1. Executive Summary

In freight procurement, misrepresenting a model's capability leads to multi-million-rupee chartering losses. This report documents the current evaluation of every ML model in the repository, run with a leakage-free, chronological methodology — including the findings we are not proud of but publish anyway.

**Headline result (October 2026 rework):** after switching to chronological train/validation/test splits, signal-aware lagged features, and *naive-anchored residual shrinkage*, **both freight regressors genuinely beat the zero-ML naive persistence baseline out-of-sample** — the RF by **27.7%** RMSE (confirmed 5/5 folds in forward-chaining cross-validation, gains of +23–31%), where the legacy models lost to it by ~30%.

## 2. Methodology

1. **Chronological 70/10/20 split** — train on the oldest 70%, tune on the next 10%, test once on the most recent 20%. No shuffled splits (which leak the future into training).
2. **Strictly lagged features** — every feature is computed from information available at t−1 (returns over 1/5/20 days, MA 7/30/90 ratios, rolling volatility, distance from the 90-day high/low, oil returns, USD/INR change).
3. **Naive-anchored residual shrinkage** — each regressor predicts only the *correction* to the naive MA7-persistence forecast, scaled by a shrinkage factor α tuned on the validation slice. The model is allowed to help only where its pattern was reliable in validation; α→0 collapses safely to the naive forecast.
4. **Classifier benchmarked against the majority class** of its own test window, with the full confusion matrix published.

## 3. Results (from `ml/reports/model_performance_evaluation.json`)

| # | Model | Task | Test metric | Zero-ML naive baseline | Status |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | **Freight RF (naive-anchored)** | Freight ETF level, 1-day horizon | $R^2 = 0.985$, RMSE `0.264` | RMSE `0.365` ($R^2 = 0.970$) | 🟢 **BEATS NAIVE by 27.7%** (α=0.75; 5/5 CV folds +23–31%) |
| **2** | **Freight GB (naive-anchored)** | Freight ETF level, 1-day horizon | $R^2 = 0.977$, RMSE `0.320` | RMSE `0.365` | 🟢 **BEATS NAIVE by 12.2%** (α=0.35) |
| **3** | **VLSFO Bunker model** | — | — | — | 🔴 **QUARANTINED** — legacy dataset failed the sanity gate (below) |
| **4** | **Charter Direction Classifier** | 3-class, 5-day freight direction | Acc `33.6%` | Majority `48.5%` | 🟡 **NO EDGE vs majority — excluded from decisions** |

## 4. The Bunker Dataset Quarantine (data-governance case study)

The legacy `historical_prices.csv` (provenance undocumented, see [DATA_PROVENANCE.md](DATA_PROVENANCE.md)) failed the evaluation's new sanity gate: although bunker~crude correlate at 0.89 across the full sample, a contemporaneous estimation model achieves **R² = −28 on the chronological holdout** — the relationship breaks down exactly where a model would need it. A bunker series that does not co-move with crude fundamentals in the holdout cannot support any model; the data is synthetic or mislabeled.

Actions taken: the dataset is **excluded from the product entirely**; the bunker figure shown in the terminal is a transparently-labeled `ESTIMATED` value derived from live crude spot (documented conversion, not a model output); and a working bunker model is blocked behind a licensed bunker assessment feed (Data Provenance §3). We publish this failure because detecting and quarantining bad data is precisely the discipline a procurement desk should demand.

## 5. Why the Classifier Ships With a Losing Record

The signal-aware direction classifier (predicting the 5-day freight direction from lagged momentum, MA structure, volatility and drawdown features) was tested across binary/3-class formulations and 5/10/20/30-day horizons. **No formulation cleared the majority-class baseline by a usable margin on the chronological holdout** — short-horizon direction on an ETF-like series is close to a coin flip after costs.

Shipping a labeled "no edge" beats shipping a collapsed or overfit classifier: the model stays in the platform as a research reference with its full confusion matrix, and every production timing signal is computed from transparent rate deltas and forecast bands instead.

## 6. What This Means for Users

1. The freight-trend corridor in the terminal is anchored by regressors with a **verified, cross-validated out-of-sample edge** over naive persistence — modest, real, and honestly labeled.
2. High $R^2$ on a level series still mostly reflects autocorrelation; the naive baseline remains the yardstick that keeps us honest.
3. Charter timing recommendations are rule-based (rate deltas, landed-cost differentials, physical constraints) and never depend on a model that fails its benchmark.

## 7. Summary: Marketing Claims vs. Actual Disclosures

| Misleading Marketing Claim | What This Terminal Actually Discloses |
|:---|:---|
| *"95% accurate AI freight forecasting"* | *"R² 0.985 reflects autocorrelation; the honest measure is the 27.7% RMSE improvement over the naive baseline on a chronological holdout, cross-validated 5/5 folds."* |
| *"AI automatically chooses when to charter"* | *"The direction classifier shows no edge over the majority baseline and is excluded from decisions; timing signals are transparent rate spreads."* |
| *"Guaranteed 20% freight cost savings"* | *"Avoided costs are estimated against alternative vessel classes under verified physical port constraints."* |
