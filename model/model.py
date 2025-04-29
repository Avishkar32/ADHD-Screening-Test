import sys
import pandas as pd
import joblib
import os
import json

# Construct the absolute path to the model file
model_path = os.path.join(os.path.dirname(__file__), 'adhd_final_model_v3.joblib')

# Load the model bundle (which is a dictionary)
model_bundle = joblib.load(model_path)

# Extract the model and scaler from the dictionary
if not isinstance(model_bundle, dict):
    raise ValueError("Expected a dictionary in the .joblib file")
if 'model' not in model_bundle or 'scaler' not in model_bundle:
    raise ValueError("Model bundle must contain 'model' and 'scaler' keys")

model = model_bundle['model']  # RandomForestClassifier
scaler = model_bundle['scaler']  # StandardScaler

# Function to predict from input data
def predict_adhd(data):
    # Convert input data to DataFrame (expecting 15 features)
    df = pd.DataFrame([data], columns=[
        'age', 'playtime_min', 'session_incomplete', 'sc_er', 'sc_de', 'sc_tct',
        'sc_rtv', 'wfs_fpr', 'wfs_prc', 'wfs_rt', 'wfs_gs', 'ft_cf', 'ft_mmv',
        'ft_eii', 'ft_tp'
    ])
    # Handle NaN values (fill with 0)
    df = df.fillna(0)
    # Scale the data using the provided scaler
    df_scaled = scaler.transform(df)
    # Predict using the model
    prediction = model.predict(df_scaled)
    probability = model.predict_proba(df_scaled)[0][1]  # Probability of ADHD (class 1)
    return {
        'prediction': int(prediction[0]),
        'probability': float(probability)
    }

# Get input from stdin (sent by Node.js)
if __name__ == "__main__":
    try:
        input_data = eval(sys.stdin.read())  # Parse JSON input
        result = predict_adhd(input_data)
        # Use json.dumps to ensure proper JSON formatting
        print(json.dumps(result))
    except Exception as e:
        # Output errors to stderr to avoid mixing with stdout
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)