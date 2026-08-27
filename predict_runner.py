import sys
import os
import json
import pickle

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file '{MODEL_PATH}' does not exist.")
    with open(MODEL_PATH, "rb") as f:
        model_data = pickle.load(f)
    return model_data

def predict(model_data, features):
    """
    Features order:
    0: billing_days
    1: avg_units
    2: month
    3: month_days
    4: projected_monthly_units
    5: is_subsidy (1 or 0)
    """
    gb = model_data.get("gradient_boosting")
    if not gb or "trees" not in gb or "base_pred" not in gb or "learning_rate" not in gb:
        raise ValueError("Invalid model artifact format in model.pkl")
    
    base_pred = float(gb["base_pred"])
    lr = float(gb["learning_rate"])
    trees = gb["trees"]

    pred = base_pred
    for tree in trees:
        curr = tree
        while not curr.get("leaf", False):
            f_idx = int(curr["feature"])
            thresh = float(curr["threshold"])
            if features[f_idx] <= thresh:
                curr = curr["left"]
            else:
                curr = curr["right"]
        pred += lr * float(curr["value"])

    return max(0.0, round(pred, 2))

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            input_data = sys.stdin.read().strip()
            if not input_data:
                raise ValueError("No input data provided")
            params = json.loads(input_data)
        else:
            params = json.loads(sys.argv[1])

        features = [
            float(params["billing_days"]),
            float(params["avg_units"]),
            float(params["month"]),
            float(params["month_days"]),
            float(params["projected_monthly_units"]),
            float(params["is_subsidy"])
        ]

        model_data = load_model()
        prediction = predict(model_data, features)

        result = {
            "status": "success",
            "model_loaded": True,
            "model_name": model_data.get("best_model_name", "Gradient Boosting Regressor"),
            "features_used": model_data.get("feature_names", [
                "billing_days", "avg_units", "month", "month_days", "projected_monthly_units", "is_subsidy"
            ]),
            "feature_values": features,
            "predicted_monthly_net_bill": prediction
        }
        print(json.dumps(result))
    except Exception as e:
        error_result = {
            "status": "error",
            "model_loaded": False,
            "error": str(e)
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)
