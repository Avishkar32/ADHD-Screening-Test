import joblib

# Load the model file
model_data = joblib.load('adhd_final_model_v3.joblib')
print(type(model_data))  # Check the type
print(model_data)        # Print the contents