// frontend/src/data/modelEvaluations.ts
import { ModelAuditData } from '../types';

export const MODEL_EVALUATION_DATA: ModelAuditData = {
  evaluation_timestamp: "2026-09-09T03:55:39",
  summary: {
    total_models_evaluated: 4,
    statuses: {
      "OK (Well-Fitted)": 4,
      "OVERFITTED": 0,
      "UNDERFITTED": 0,
      "NO SKILL VS NAIVE BASELINE": 3
    },
    naive_baseline_check: {
      description: "Freight rate and bunker models are benchmarked against a zero-ML naive persistence baseline (yesterday's moving average) to verify real predictive skill beyond time-series autocorrelation.",
      models_checked: 3,
      models_beating_naive_baseline: 0
    }
  },
  models: {
    freight_random_forest_regressor: {
      model_name: "Freight Rate Random Forest Regressor",
      task: "Regression (Dry Bulk Index BDRY Prediction)",
      dataset: "processed_freight_training_data.csv",
      train_samples: 1634,
      test_samples: 409,
      metrics: {
        train_rmse: 0.6445,
        test_rmse: 0.4708,
        train_mae: 0.4396,
        test_mae: 0.3744,
        train_r2: 0.9938,
        test_r2: 0.953,
        rmse_overfit_gap: -0.1737,
        rmse_overfit_ratio: 0.7305,
        naive_baseline_rmse: 0.3608,
        naive_baseline_r2: 0.9724,
        beats_naive_baseline: false,
        skill_gain_vs_naive_pct: -30.49
      },
      status: "OK (Well-Fitted) / NO SKILL VS NAIVE BASELINE",
      diagnosis_reason: "Train and test performance are well-balanced (Overfit Ratio=0.73, Test R2=0.953). AUDIT NOTE: Model RMSE (0.4708) does not beat the naive persistence baseline RMSE (0.3608) — high R² is driven by target autocorrelation. The model should be treated as an empirical trend smoother rather than a predictive market crystal ball.",
      confusion_matrix: [
        [137, 0, 0],
        [24, 98, 13],
        [0, 8, 129]
      ]
    },
    freight_gradient_boosting_regressor: {
      model_name: "Freight Rate Gradient Boosting Regressor",
      task: "Regression (Dry Bulk Index BDRY Prediction)",
      dataset: "processed_freight_training_data.csv",
      train_samples: 1634,
      test_samples: 409,
      metrics: {
        train_rmse: 0.5873,
        test_rmse: 0.4744,
        train_mae: 0.4118,
        test_mae: 0.3594,
        train_r2: 0.9948,
        test_r2: 0.9522,
        rmse_overfit_gap: -0.113,
        rmse_overfit_ratio: 0.8077,
        naive_baseline_rmse: 0.3608,
        naive_baseline_r2: 0.9724,
        beats_naive_baseline: false,
        skill_gain_vs_naive_pct: -31.48
      },
      status: "OK (Well-Fitted) / NO SKILL VS NAIVE BASELINE",
      diagnosis_reason: "Train and test performance are well-balanced (Overfit Ratio=0.81, Test R2=0.952). AUDIT NOTE: Model RMSE (0.4744) does not beat naive persistence baseline (0.3608). Projections must be presented as experimental indicators with explicit confidence intervals.",
      confusion_matrix: [
        [137, 0, 0],
        [25, 99, 11],
        [0, 12, 125]
      ]
    },
    bunker_price_ridge_regressor: {
      model_name: "VLSFO Bunker Price Regularized Regressor",
      task: "Regression (VLSFO Fuel Price Forecasting)",
      dataset: "historical_prices.csv",
      train_samples: 581,
      test_samples: 146,
      metrics: {
        train_rmse: 7.1332,
        test_rmse: 7.606,
        train_mae: 5.674,
        test_mae: 6.2342,
        train_r2: 0.9904,
        test_r2: 0.7787,
        rmse_overfit_gap: 0.4728,
        rmse_overfit_ratio: 1.0663,
        naive_baseline_rmse: 6.1801,
        naive_baseline_r2: 0.8539,
        beats_naive_baseline: false,
        skill_gain_vs_naive_pct: -23.07
      },
      status: "OK (Well-Fitted) / NO SKILL VS NAIVE BASELINE",
      diagnosis_reason: "Regularized Ridge regression prevents parameter explosion (Overfit Ratio=1.07). Model RMSE ($7.61) tracks close to persistence ($6.18). Suitable for operational budgeting with transparent bounds.",
      confusion_matrix: [
        [36, 12, 0],
        [2, 28, 18],
        [0, 2, 48]
      ]
    },
    chartering_decision_classifier: {
      model_name: "Vessel Chartering Action Decision Classifier",
      task: "3-Class Classification (HOLD / WAIT, NEUTRAL, CHARTER NOW)",
      dataset: "processed_freight_training_data.csv",
      train_samples: 1634,
      test_samples: 409,
      metrics: {
        train_accuracy: 0.6695,
        test_accuracy: 0.5623,
        accuracy_gap: 0.1072,
        precision_macro: 0.1874,
        recall_macro: 0.3333,
        f1_score_macro: 0.24
      },
      status: "OK (Well-Fitted) / MAJORITY CLASS COLLAPSE",
      diagnosis_reason: "CRITICAL TRANSPARENCY DISCLOSURE: Test accuracy is 56.23% with a macro F1 of 0.24. Inspection of the confusion matrix reveals that the classifier predicts class 'CHARTER NOW' for 100% of test points (230 true positives, 179 false positives, 0 predictions for WAIT or NEUTRAL). The platform DOES NOT use this uncalibrated classifier for automated procurement execution; recommendations are driven by transparent price-delta heuristics and landed-cost optimization.",
      confusion_matrix: [
        [0, 0, 63],
        [0, 0, 116],
        [0, 0, 230]
      ]
    }
  }
};
