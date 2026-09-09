# ml/predict_and_visualize.py
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
csv_path = os.path.join(DATASETS_DIR, "processed_freight_training_data.csv")

if not os.path.exists(csv_path):
    csv_path = "processed_freight_training_data.csv"

# 1. Load Data
df = pd.read_csv(csv_path, index_col=0, parse_dates=True)

# 2. Train Model on 80% and Test on 20%
X = df.drop(columns=['Dry_Bulk_Index'])
y = df['Dry_Bulk_Index']

split_idx = int(len(df) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 3. Predict Test Set
predictions = model.predict(X_test)
test_results = pd.DataFrame({'Actual': y_test, 'Predicted': predictions}, index=y_test.index)

# 4. Decision Engine Logic (Rule-based recommendation)
latest_actual = test_results['Actual'].iloc[-1]
latest_predicted = test_results['Predicted'].iloc[-1]
predicted_change_pct = ((latest_predicted - latest_actual) / latest_actual) * 100

print("\n==========================================")
print("       VESSEL CHARTERING DECISION         ")
print("==========================================")
print(f"Current Dry Bulk Rate Index: {latest_actual:.2f}")
print(f"Forecasted Rate Index:       {latest_predicted:.2f}")
print(f"Predicted Trend:             {predicted_change_pct:+.2f}%")

if predicted_change_pct > 2.0:
    print("ACTION: [ CHARTER NOW ] -> Freight rates are projected to rise.")
elif predicted_change_pct < -2.0:
    print("ACTION: [ HOLD / WAIT ]  -> Freight rates are projected to drop.")
else:
    print("ACTION: [ NEUTRAL ]      -> Rates are stable. Execute routine booking.")
print("==========================================\n")

# 5. Plot Actual vs Predicted
plt.figure(figsize=(12, 6))
plt.plot(test_results.index, test_results['Actual'], label='Actual Index', color='blue', alpha=0.7)
plt.plot(test_results.index, test_results['Predicted'], label='Model Prediction', color='red', linestyle='--')
plt.title('Freight Rate Index: Actual vs Predicted Performance')
plt.xlabel('Date')
plt.ylabel('Dry Bulk Index Value')
plt.legend()
plt.grid(True)
plt.tight_layout()

os.makedirs(REPORTS_DIR, exist_ok=True)
chart_path = os.path.join(REPORTS_DIR, 'model_performance_chart.png')
plt.savefig(chart_path)
print(f"Graph saved as '{chart_path}'.")
