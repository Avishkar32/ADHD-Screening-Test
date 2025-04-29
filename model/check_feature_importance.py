import joblib
import os

# Load the model
model_path = os.path.join(os.path.dirname(__file__), 'adhd_final_model_v3.joblib')
model_bundle = joblib.load(model_path)
model = model_bundle['model']  # RandomForestClassifier

# Feature names
features = ['age', 'playtime_min', 'session_incomplete', 'sc_er', 'sc_de', 'sc_tct',
            'sc_rtv', 'wfs_fpr', 'wfs_prc', 'wfs_rt', 'wfs_gs', 'ft_cf', 'ft_mmv',
            'ft_eii', 'ft_tp']

# Get feature importances
importances = model.feature_importances_
for feature, importance in zip(features, importances):
    print(f"{feature}: {importance:.4f}")