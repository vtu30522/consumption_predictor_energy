"""
Smart Energy Consumption and AP Electricity Bill ML Model Trainer
Trains and compares:
1. Linear Regression
2. Random Forest Regressor
3. Gradient Boosting Regressor

Target: net_bill (projected monthly net bill)
Derived features from user input:
- billing_days
- avg_units
- month
- month_days
- projected_monthly_units
- subsidy_available (encoded)

Evaluated on 80% train / 20% test split with random_state=42.
Saves the best model to model.pkl and metadata to model_metadata.json.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

DATASET_PATH = "smart_energy_AP_bill_dataset_100000.csv"
MODEL_PATH = "model.pkl"
METADATA_PATH = "model_metadata.json"

def create_dataset_if_missing():
    if os.path.exists(DATASET_PATH):
        return
    print(f"Generating {DATASET_PATH} with 100,000 records...")
    import csv, datetime, random
    random.seed(42)
    
    headers = [
        "from_date", "to_date", "billing_days", "meter_units", "state", 
        "subsidy_available", "kvah", "avg_units", "billed_units", 
        "energy_charge", "fixed_charge", "electricity_duty", "fppca_charge", 
        "other_charges", "bill_amount", "govt_subsidy", "net_bill"
    ]
    
    def calc_ap_energy_charge(units):
        if units <= 0: return 0.0
        charge = 0.0
        rem = units
        s1 = min(rem, 30.0); charge += s1 * 1.90; rem -= s1
        if rem > 0: s2 = min(rem, 45.0); charge += s2 * 2.60; rem -= s2
        if rem > 0: s3 = min(rem, 50.0); charge += s3 * 3.60; rem -= s3
        if rem > 0: s4 = min(rem, 100.0); charge += s4 * 6.90; rem -= s4
        if rem > 0: s5 = min(rem, 175.0); charge += s5 * 7.80; rem -= s5
        if rem > 0: charge += rem * 9.75
        return round(charge, 2)

    start_date = datetime.date(2023, 1, 1)
    with open(DATASET_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for i in range(100000):
            day_off = random.randint(0, 700)
            from_d = start_date + datetime.timedelta(days=day_off)
            billing_days = random.randint(25, 35)
            to_d = from_d + datetime.timedelta(days=billing_days - 1)
            
            base_monthly = max(20.0, random.gauss(210, 95))
            if random.random() < 0.08:
                base_monthly = random.uniform(350, 750)
                
            m = from_d.month
            y = from_d.year
            next_m = datetime.date(y + 1, 1, 1) if m == 12 else datetime.date(y, m + 1, 1)
            month_days = (next_m - datetime.date(y, m, 1)).days
            
            avg_units = base_monthly / month_days
            meter_units = round(avg_units * billing_days, 2)
            state = "AP"
            subsidy = "Yes" if random.random() < 0.45 else "No"
            kvah = round(meter_units * random.uniform(1.01, 1.05), 2)
            
            echarge = calc_ap_energy_charge(meter_units)
            fcharge = 40.0 if meter_units <= 100 else (60.0 if meter_units <= 200 else 100.0)
            duty = round(meter_units * 0.06, 2)
            fppca = round(meter_units * 0.45, 2)
            other = round(random.choice([15.0, 20.0, 25.0, 30.0]), 2)
            bill_amt = round(echarge + fcharge + duty + fppca + other, 2)
            
            if subsidy == "Yes":
                if meter_units <= 100:
                    gsub = round(bill_amt * random.uniform(0.65, 0.95), 2)
                elif meter_units <= 200:
                    gsub = round(bill_amt * random.uniform(0.25, 0.45), 2)
                else:
                    gsub = round(min(bill_amt * 0.15, 250.0), 2)
            else:
                gsub = 0.0
            
            net_bill = max(0.0, round(bill_amt - gsub, 2))
            writer.writerow([
                from_d.strftime("%Y-%m-%d"), to_d.strftime("%Y-%m-%d"),
                billing_days, meter_units, state, subsidy, kvah, round(avg_units, 4),
                meter_units, echarge, fcharge, duty, fppca, other, bill_amt, gsub, net_bill
            ])

def train_and_evaluate():
    create_dataset_if_missing()
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    
    # Feature Engineering from user inputs only (No data leakage!)
    # Available user inputs: from_date, to_date, meter_units, state, subsidy_available
    df['from_date'] = pd.to_datetime(df['from_date'])
    df['to_date'] = pd.to_datetime(df['to_date'])
    
    df['billing_days'] = (df['to_date'] - df['from_date']).dt.days + 1
    df['avg_units'] = df['meter_units'] / df['billing_days']
    df['month'] = df['from_date'].dt.month
    df['month_days'] = df['from_date'].dt.days_in_month
    df['projected_monthly_units'] = df['avg_units'] * df['month_days']
    df['subsidy_encoded'] = (df['subsidy_available'] == 'Yes').astype(int)
    
    # Target: projected monthly net bill
    # In dataset net_bill is for billing_days. Target represents the full month predicted bill
    df['target_monthly_net_bill'] = (df['net_bill'] / df['billing_days']) * df['month_days']
    
    features = ['billing_days', 'avg_units', 'month', 'month_days', 'projected_monthly_units', 'subsidy_encoded']
    X = df[features]
    y = df['target_monthly_net_bill']
    
    # 80/20 train/test split with random_state=42
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training set: {X_train.shape[0]} rows, Test set: {X_test.shape[0]} rows")
    
    # 1. Linear Regression
    print("Training Linear Regression...")
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    lr_preds = np.clip(lr.predict(X_test), 0, None)
    
    # 2. Random Forest Regressor
    print("Training Random Forest Regressor...")
    rf = RandomForestRegressor(n_estimators=50, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_preds = np.clip(rf.predict(X_test), 0, None)
    
    # 3. Gradient Boosting Regressor
    print("Training Gradient Boosting Regressor...")
    gb = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    gb.fit(X_train, y_train)
    gb_preds = np.clip(gb.predict(X_test), 0, None)
    
    def compute_metrics(y_true, y_pred):
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2 = float(r2_score(y_true, y_pred))
        return round(mae, 2), round(rmse, 2), round(r2, 4)
    
    lr_mae, lr_rmse, lr_r2 = compute_metrics(y_test, lr_preds)
    rf_mae, rf_rmse, rf_r2 = compute_metrics(y_test, rf_preds)
    gb_mae, gb_rmse, gb_r2 = compute_metrics(y_test, gb_preds)
    
    models = [
        {"name": "Linear Regression", "model": lr, "mae": lr_mae, "rmse": lr_rmse, "r2": lr_r2, "is_best": False},
        {"name": "Random Forest Regressor", "model": rf, "mae": rf_mae, "rmse": rf_rmse, "r2": rf_r2, "is_best": False},
        {"name": "Gradient Boosting Regressor", "model": gb, "mae": gb_mae, "rmse": gb_rmse, "r2": gb_r2, "is_best": False}
    ]
    
    # Best model by R2 and lowest RMSE
    best_model_info = max(models, key=lambda m: m["r2"])
    best_model_info["is_best"] = True
    
    print("\n" + "="*55)
    print("MODEL EVALUATION RESULTS (80/20 Test Split, N=20,000)")
    print("="*55)
    for m in models:
        badge = " [SELECTED BEST MODEL]" if m["is_best"] else ""
        print(f"{m['name']:<30} | MAE: ₹{m['mae']:<7} | RMSE: ₹{m['rmse']:<7} | R²: {m['r2']}{badge}")
    print("="*55)
    
    # Save best model
    joblib.dump(best_model_info["model"], MODEL_PATH)
    
    perf_summary = [{k: v for k, v in m.items() if k != "model"} for m in models]
    metadata = {
        "best_model_name": best_model_info["name"],
        "performance": perf_summary,
        "feature_names": features,
        "dataset_rows": 100000,
        "split": "80/20",
        "random_state": 42
    }
    
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nSaved best model '{best_model_info['name']}' to {MODEL_PATH}")
    print(f"Saved performance metadata to {METADATA_PATH}")

if __name__ == "__main__":
    train_and_evaluate()
