# ml/baseline_model.py
import os
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import root_mean_squared_error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
csv_path = os.path.join(DATASETS_DIR, "processed_freight_training_data.csv")

if not os.path.exists(csv_path):
    csv_path = "processed_freight_training_data.csv"

# 1. Load data
df = pd.read_csv(csv_path, index_col=0, parse_dates=True)

# 2. Define Features (X) and Target (y)
X = df.drop(columns=['Dry_Bulk_Index'])
y = df['Dry_Bulk_Index']

# 3. Chronological Split (80% Train, 20% Test)
split_idx = int(len(df) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

# 4. Train Model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Make Predictions and Evaluate
predictions = model.predict(X_test)
rmse = root_mean_squared_error(y_test, predictions)

print(f"Baseline Random Forest RMSE: {rmse:.2f}")
