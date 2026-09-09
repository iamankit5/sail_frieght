# SAIL AI Maritime Machine Learning — Model Honesty & Scientific Audit Report

> **Audited for SIH 2026 Competition Jury & Technical Evaluation Panels**  
> *Author: SAIL Ocean Logistics AI Research Team*  
> *Date: September 2026*

---

## 1. Executive Summary & Core Principle

In maritime logistics and commodity procurement, mathematical honesty is a safety and fiduciary obligation. Misrepresenting a predictive model’s capability can lead to multi-million-rupee chartering losses, unhedged fuel exposure, and vessel berthing disputes.

This report documents the rigorous evaluation of all machine learning models in the SAIL Freight Intelligence repository. Unlike typical hackathon presentations that claim "95% accuracy" or "AI guarantees savings," our evaluation engine tests models against **zero-ML naive persistence baselines**, investigates time-series autocorrelation, and exposes class distributions in confusion matrices.

---

## 2. Model Performance Summary & Baseline Benchmarks

All models were evaluated on chronological train/test splits (80% training on older data, 20% testing on recent out-of-sample data). The results from `ml/reports/model_performance_evaluation.json` are summarized below:

| # | Model Name | Task | Test Metric | Zero-ML Baseline | Overfit Ratio | Validated Status |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| **1** | **Freight RF Regressor** | Dry Bulk Index ($BDRY$) | $R^2 = 0.953$<br>$\text{RMSE} = 0.471$ | $R^2 = 0.972$<br>$\text{RMSE} = 0.361$ | `0.73` | 🟡 **OK (Well-Fitted) / No Skill vs Naive** |
| **2** | **Freight GB Regressor** | Dry Bulk Index ($BDRY$) | $R^2 = 0.952$<br>$\text{RMSE} = 0.474$ | $R^2 = 0.972$<br>$\text{RMSE} = 0.361$ | `0.81` | 🟡 **OK (Well-Fitted) / No Skill vs Naive** |
| **3** | **VLSFO Bunker Fuel Regressor** | VLSFO Price ($/MT) | $R^2 = 0.779$<br>$\text{RMSE} = \$7.61$ | $R^2 = 0.854$<br>$\text{RMSE} = \$6.18$ | `1.07` | 🟢 **OK (Well-Fitted) / Real Commodity Feed** |
| **4** | **Charter Action Classifier** | 3-Class Decision Signal | Test Acc: `56.2%` | Majority: `56.2%` | Gap: `10.7%` | 🔴 **OK (Well-Fitted) / Majority Class Collapse** |

---

## 3. Why High $R^2$ Does NOT Mean "Predicting the Market"

### The Autoregressive Illusion
In financial time series (like the Baltic Dry Index or Bunker Fuel spot prices), commodity prices follow a random walk with strong day-to-day autocorrelation:

$$y_t = y_{t-1} + \epsilon_t$$

If a regression model simply predicts $\hat{y}_t \approx y_{t-1}$, its correlation ($R^2$) with $y_t$ will artificially appear to be $> 0.95$. However, this is **not predictive skill** — it is merely learning the identity function of yesterday's price.

### The Zero-ML Naive Baseline Test
To detect this illusion, our evaluation framework compares every regressor against a zero-ML baseline that predicts tomorrow's value using yesterday's 7-day moving average ($MA_7$, lagged by 1 day to prevent leakage).

- **Naive Baseline RMSE:** `0.3608`
- **Random Forest RMSE:** `0.4708` (30.5% *worse* than naive persistence)
- **Gradient Boosting RMSE:** `0.4744` (31.5% *worse* than naive persistence)

**Conclusion:** Neither the Random Forest nor the Gradient Boosting model outperforms simple persistence. Therefore, the web application:
1. **Never claims** the AI can forecast future macro market movements with certainty.
2. Explicitly labels the 30-day forecast as an **Experimental Trend Corridor** with 95% confidence bands.
3. Informs judges transparently that freight decisions should be cross-verified against operational physical constraints.

---

## 4. The Chartering Classifier Class Collapse

### Test Metrics
- **Test Accuracy:** 56.23%
- **Macro Precision:** 18.74%
- **Macro Recall:** 33.33%
- **Macro F1 Score:** 0.2400

### Confusion Matrix Analysis
The out-of-sample confusion matrix across 409 test records is:

```
                  Predicted: HOLD (0)  |  Predicted: NEUTRAL (1)  |  Predicted: CHARTER (2)
Actual: HOLD (0)           0           |            0             |           63
Actual: NEUTRAL (1)        0           |            0             |          116
Actual: CHARTER (2)        0           |            0             |          230
```

### Root Cause
Because the training set had an upward trend during the sample window, the decision tree ensemble learned that predicting class 2 ("CHARTER NOW") minimizes cross-entropy loss across the majority class. As a result, **100% of test records were predicted as "CHARTER NOW"**, yielding an apparent 56.2% accuracy while having **zero precision or recall** on classes 0 (HOLD) and 1 (NEUTRAL).

### Decision-Layer Resolution in the Platform
1. **Removed Uncalibrated Classifier from Autonomous Actions:** The standalone classifier is strictly excluded from making automated charter commitments.
2. **Deterministic Rate Delta Thresholds:** Chartering recommendation signals ("HOLD / WAIT" vs "CHARTER NOW") are computed transparently from multi-horizon moving average spreads and landed cost variances.
3. **Full Disclosure in UI:** The judge-facing "ML Honesty & Audit" tab exposes this exact confusion matrix and diagnosis to demonstrate superior technical understanding during competition Q&A.

---

## 5. Physical Feasibility vs Machine Learning Scores

A vessel that physically cannot berth at a port due to shallow draft (e.g., a Capesize vessel with 18.2m draft attempting to dock at Haldia port with an 8.5m river limit) must **never** be presented as an acceptable option, regardless of its low cost-per-tonne or high ML score.

The platform enforces:
- When $\text{Draft}_{\text{vessel}} > \text{Draft}_{\text{port}}$, the vessel status is irrevocably set to:
  $$\text{Feasibility} = \mathbf{\text{🔴 INFEASIBLE: Draft Exceeds Port Limit}}$$
- Infeasible vessels are visually demarcated and blocked in the UI comparison table.

---

## 6. Summary for Judges

| Misleading Marketing Claim | What the SAIL Intelligence Terminal Actually Discloses |
|:---|:---|
| *"95% accurate AI freight forecasting"* | *"Model has $R^2=0.95$ due to autocorrelation, but does not beat naive persistence. Forecast displayed with 95% uncertainty band."* |
| *"AI automatically chooses when to charter"* | *"Classifier exhibits majority class bias (Macro F1: 0.24). Recommendations are driven by transparent rate spreads & landed-cost differentials."* |
| *"Guaranteed 20% freight cost savings"* | *"Avoided costs are estimated against alternative vessel classes under verified physical port constraints."* |
