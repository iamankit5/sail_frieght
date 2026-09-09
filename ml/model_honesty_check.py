# ml/model_honesty_check.py
"""
SAIL AI MODEL HONESTY & TRANSPARENCY AUDIT SCRIPT
-----------------------------------------------------------------------------
Reads model_performance_evaluation.json and generates an honest verification 
audit report suitable for competition judges, technical procurement teams, 
and stakeholders.

DO NOT suppress or cosmetically alter model performance metrics.
-----------------------------------------------------------------------------
"""

import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "reports", "model_performance_evaluation.json")

def run_honesty_audit():
    print("=" * 80)
    print("        SAIL AI MARITIME ML MODEL HONESTY & TRANSPARENCY AUDIT        ")
    print("=" * 80)

    if not os.path.exists(JSON_PATH):
        print(f"[ERROR] Evaluation JSON not found at {JSON_PATH}. Run evaluate_ml_models.py first.")
        return False

    with open(JSON_PATH, "r") as f:
        data = json.load(f)

    timestamp = data.get("evaluation_timestamp", "Unknown")
    models = data.get("models", {})

    print(f"Audit Timestamp: {timestamp}")
    print(f"Total Models Assessed: {len(models)}\n")

    print("-" * 80)
    print(f"{'Model Name':<35} | {'Test Metric':<16} | {'Naive Baseline':<16} | {'Status'}")
    print("-" * 80)

    for key, m in models.items():
        name = m.get("model_name", key)
        metrics = m.get("metrics", {})
        status = m.get("status", "Unknown")

        if "test_r2" in metrics:
            test_val = f"R²={metrics['test_r2']:.3f}"
            naive_val = f"R²={metrics.get('naive_baseline_r2', 'N/A')}"
        elif "test_accuracy" in metrics:
            test_val = f"Acc={metrics['test_accuracy']*100:.1f}%"
            naive_val = f"Macro F1={metrics.get('f1_score_macro', 'N/A')}"
        else:
            test_val = "N/A"
            naive_val = "N/A"

        print(f"{name[:35]:<35} | {test_val:<16} | {naive_val:<16} | {status}")

    print("-" * 80)
    print("\nCRITICAL AUDIT FINDINGS & DISCLOSURES:")
    print("1. Zero-ML Naive Persistence Audit:")
    print("   - High R² (>0.95) on the Dry Bulk Index is primarily driven by strong time-series")
    print("     autocorrelation. Both Random Forest and Gradient Boosting models fail to beat")
    print("     the simple naive persistence baseline (yesterday's 7-day moving average).")
    print("   - CONCLUSION: Freight models provide no measurable forecasting skill beyond")
    print("     assuming persistence. Projections should be presented as experimental indicators.")

    print("\n2. Chartering Decision Classifier Collapse:")
    print("   - The 3-class chartering classifier exhibits class collapse, predicting the majority")
    print("     class ('CHARTER NOW') across virtually all test instances.")
    print("   - Macro F1 is ~0.24 and macro precision is ~18.7%.")
    print("   - CONCLUSION: Standalone classifier outputs MUST NOT be presented as high-accuracy AI.")
    print("     Decision logic in the procurement UI is properly guided by deterministic")
    print("     moving average delta thresholds and landed cost differentials.")
    print("=" * 80)
    return True

if __name__ == "__main__":
    run_honesty_audit()
