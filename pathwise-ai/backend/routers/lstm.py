"""
routers/lstm.py — LSTM prediction engine endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/prediction")
def get_prediction():
    """Current LSTM confidence, horizon, and alert status."""
    from main import sim
    snap = sim.snapshot()
    return {
        "confidence_pct":   round(snap["lstm"]["conf"] * 100, 3),
        "horizon_sec":      snap["lstm"]["hor"],
        "alert":            snap["lstm"]["alert"],
        "alert_threshold":  85.0,
        "switch_threshold": 92.0,
        "phase":            snap["phase"],
    }


@router.get("/config")
def get_lstm_config():
    """LSTM model configuration and thresholds."""
    return {
        "architecture":     "LSTM seq2seq",
        "input_window":     "30 samples · 500ms interval",
        "features":         ["latency_ms", "jitter_ms", "packet_loss_pct"],
        "predict_horizon":  "30–60 seconds",
        "alert_threshold":  0.85,
        "switch_threshold": 0.92,
        "target_accuracy":  "≥ 90% MSE",
        "data_source":      "FCC Measuring Broadband America 2023",
    }
