import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import root_mean_squared_error

# 1. Load the previously saved data
df = pd.read_csv("processed_freight_training_data.csv", index_col=0, parse_dates=True)

# 2. Define Features (X) and Target (y)
# We are trying to predict the Dry_Bulk_Index
X = df.drop(columns=['Dry_Bulk_Index'])
y = df['Dry_Bulk_Index']

# 3. Chronological Split (80% Train, 20% Test)
split_idx = int(len(df) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

# 4. Train the Model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Make Predictions and Evaluate
predictions = model.predict(X_test)
rmse = root_mean_squared_error(y_test, predictions)

print(f"Baseline Random Forest RMSE: {rmse:.2f}")