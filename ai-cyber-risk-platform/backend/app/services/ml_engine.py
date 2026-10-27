import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, roc_curve, auc

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RF_MODEL_PATH = os.path.join(MODEL_DIR, "rf_model.pkl")
IF_MODEL_PATH = os.path.join(MODEL_DIR, "if_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "ml_metrics.pkl")

# Feature labels
FEATURE_NAMES = [
    "failed_login_count",
    "login_frequency",
    "source_ip_reputation",
    "country_change",
    "request_frequency",
    "port_activity_entropy"
]

TARGET_NAMES = ["Normal", "Suspicious", "Malicious"]

def generate_synthetic_dataset(n_samples: int = 3000) -> Tuple[pd.DataFrame, pd.Series]:
    """Generates realistic cyber security events with known normal and attack distributions."""
    np.random.seed(42)
    
    # 1. Normal traffic (~70%)
    n_normal = int(n_samples * 0.70)
    normal_failed_logins = np.random.poisson(lam=0.4, size=n_normal)
    normal_login_freq = np.random.gamma(shape=1.5, scale=0.8, size=n_normal)
    normal_ip_rep = np.random.uniform(70.0, 99.0, size=n_normal)
    normal_country_change = np.random.choice([0, 1], p=[0.98, 0.02], size=n_normal)
    normal_req_freq = np.random.normal(loc=12.0, scale=4.0, size=n_normal).clip(1.0, 50.0)
    normal_port_entropy = np.random.normal(loc=0.8, scale=0.3, size=n_normal).clip(0.1, 2.0)
    y_normal = np.zeros(n_normal, dtype=int)
    
    # 2. Suspicious traffic (~18%)
    n_susp = int(n_samples * 0.18)
    susp_failed_logins = np.random.poisson(lam=4.5, size=n_susp)
    susp_login_freq = np.random.gamma(shape=3.0, scale=1.5, size=n_susp)
    susp_ip_rep = np.random.uniform(30.0, 65.0, size=n_susp)
    susp_country_change = np.random.choice([0, 1], p=[0.70, 0.30], size=n_susp)
    susp_req_freq = np.random.normal(loc=45.0, scale=15.0, size=n_susp).clip(10.0, 90.0)
    susp_port_entropy = np.random.normal(loc=2.2, scale=0.5, size=n_susp).clip(1.0, 3.5)
    y_susp = np.ones(n_susp, dtype=int)
    
    # 3. Malicious attacks (~12%) - Brute force, Port scans, C2 bursts
    n_mal = n_samples - n_normal - n_susp
    mal_failed_logins = np.random.poisson(lam=18.0, size=n_mal).clip(8, 60)
    mal_login_freq = np.random.gamma(shape=7.0, scale=2.5, size=n_mal).clip(10.0, 50.0)
    mal_ip_rep = np.random.uniform(5.0, 35.0, size=n_mal)
    mal_country_change = np.random.choice([0, 1], p=[0.40, 0.60], size=n_mal)
    mal_req_freq = np.random.normal(loc=110.0, scale=30.0, size=n_mal).clip(50.0, 200.0)
    mal_port_entropy = np.random.normal(loc=4.2, scale=0.6, size=n_mal).clip(2.5, 5.0)
    y_mal = np.full(n_mal, 2, dtype=int)
    
    X = pd.DataFrame({
        "failed_login_count": np.concatenate([normal_failed_logins, susp_failed_logins, mal_failed_logins]),
        "login_frequency": np.concatenate([normal_login_freq, susp_login_freq, mal_login_freq]),
        "source_ip_reputation": np.concatenate([normal_ip_rep, susp_ip_rep, mal_ip_rep]),
        "country_change": np.concatenate([normal_country_change, susp_country_change, mal_country_change]),
        "request_frequency": np.concatenate([normal_req_freq, susp_req_freq, mal_req_freq]),
        "port_activity_entropy": np.concatenate([normal_port_entropy, susp_port_entropy, mal_port_entropy]),
    })
    
    y = pd.Series(np.concatenate([y_normal, y_susp, y_mal]))
    return X, y


class MLEngine:
    def __init__(self):
        self.rf_model = None
        self.if_model = None
        self.metrics = None
        self.load_or_train()
        
    def load_or_train(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        if os.path.exists(RF_MODEL_PATH) and os.path.exists(IF_MODEL_PATH) and os.path.exists(METRICS_PATH):
            try:
                self.rf_model = joblib.load(RF_MODEL_PATH)
                self.if_model = joblib.load(IF_MODEL_PATH)
                self.metrics = joblib.load(METRICS_PATH)
                return
            except Exception:
                pass
        self.train_models()
        
    def train_models(self) -> Dict[str, Any]:
        """Trains both Random Forest and Isolation Forest and compiles academic evaluation metrics."""
        X, y = generate_synthetic_dataset(n_samples=3500)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
        
        # 1. Supervised: Random Forest
        rf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight="balanced")
        rf.fit(X_train, y_train)
        
        # 2. Unsupervised: Isolation Forest for Anomaly Detection (fit on normal data)
        X_train_normal = X_train[y_train == 0]
        iso = IsolationForest(n_estimators=100, contamination=0.10, random_state=42)
        iso.fit(X_train_normal)
        
        # Evaluations
        y_pred = rf.predict(X_test)
        y_prob = rf.predict_proba(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        # Feature importances
        feature_importance = [
            {"feature": name, "importance": round(float(imp), 4)}
            for name, imp in zip(FEATURE_NAMES, rf.feature_importances_)
        ]
        feature_importance.sort(key=lambda x: x["importance"], reverse=True)
        
        # ROC curve for Malicious class (class index 2)
        y_binary = (y_test == 2).astype(int)
        y_mal_prob = y_prob[:, 2]
        fpr, tpr, _ = roc_curve(y_binary, y_mal_prob)
        roc_auc = auc(fpr, tpr)
        
        # Sample 20 points for smooth UI plotting
        indices = np.linspace(0, len(fpr) - 1, min(20, len(fpr))).astype(int)
        roc_points = [{"fpr": round(float(fpr[i]), 3), "tpr": round(float(tpr[i]), 3)} for i in indices]
        
        metrics = {
            "accuracy": round(float(acc) * 100, 2),
            "precision": round(float(prec) * 100, 2),
            "recall": round(float(rec) * 100, 2),
            "f1_score": round(float(f1) * 100, 2),
            "roc_auc": round(float(roc_auc), 3),
            "confusion_matrix": cm,
            "feature_importance": feature_importance,
            "roc_points": roc_points,
            "total_samples": len(X),
            "test_samples": len(X_test)
        }
        
        self.rf_model = rf
        self.if_model = iso
        self.metrics = metrics
        
        # Save artifacts
        joblib.dump(rf, RF_MODEL_PATH)
        joblib.dump(iso, IF_MODEL_PATH)
        joblib.dump(metrics, METRICS_PATH)
        return metrics

    def predict_event(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Classifies a live security event and calculates its anomaly score."""
        row_dict = {
            "failed_login_count": [float(features.get("failed_login_count", 0))],
            "login_frequency": [float(features.get("login_frequency", 1.0))],
            "source_ip_reputation": [float(features.get("source_ip_reputation", 80.0))],
            "country_change": [float(features.get("country_change", 0))],
            "request_frequency": [float(features.get("request_frequency", 10.0))],
            "port_activity_entropy": [float(features.get("port_activity_entropy", 0.5))]
        }
        
        X_df = pd.DataFrame(row_dict, columns=FEATURE_NAMES)
        
        # Supervised prediction
        pred_idx = self.rf_model.predict(X_df)[0]
        prediction_label = TARGET_NAMES[pred_idx]
        probabilities = self.rf_model.predict_proba(X_df)[0]
        confidence = float(np.max(probabilities))
        
        # Unsupervised anomaly prediction:
        # decision_function gives > 0 for inliers, < 0 for outliers
        dec_score = float(self.if_model.decision_function(X_df)[0])
        # Map decision score into [0, 1] anomaly score where 1.0 is extreme anomaly
        # Normal inliers have dec_score around +0.10 to +0.25 -> anomaly_score around 0.05 to 0.25
        # Abnormal outliers have dec_score < 0 -> anomaly_score > 0.60
        anomaly_score = float(np.clip(0.5 - (dec_score * 2.5), 0.05, 0.99))
        
        is_anomalous = bool(self.if_model.predict(X_df)[0] == -1)
        
        return {
            "prediction": prediction_label,
            "confidence": round(confidence * 100, 1),
            "anomaly_score": round(anomaly_score, 2),
            "is_anomalous": is_anomalous,
            "probabilities": {
                "Normal": round(float(probabilities[0]) * 100, 1),
                "Suspicious": round(float(probabilities[1]) * 100, 1),
                "Malicious": round(float(probabilities[2]) * 100, 1)
            }
        }

ml_engine = MLEngine()
