"""
config/settings.py — PathWise AI Centralized Configuration
"""

# ── SERVER ────────────────────────────────────────────────────────────────────
HOST = "0.0.0.0"
PORT = 8000

# ── DEMO ENGINE ───────────────────────────────────────────────────────────────
AUTO_DEGRADATION_AT_SEC = 15.0    # seconds after demo start
TICK_INTERVAL_MS        = 500     # simulation tick rate

# ── LSTM THRESHOLDS ───────────────────────────────────────────────────────────
LSTM_ALERT_THRESHOLD  = 0.85      # fire alert at 85% confidence
LSTM_SWITCH_THRESHOLD = 0.92      # execute switch at 92% confidence
LSTM_TARGET_ACCURACY  = 0.90      # ≥90% MSE target
LSTM_PREDICT_HORIZON  = (30, 60)  # seconds ahead

# ── REAL-WORLD BASELINES ──────────────────────────────────────────────────────
# Source: FCC Measuring Broadband America 2023
FIBER_BASELINE = {
    "latency_ms":     8.2,
    "jitter_ms":      0.9,
    "packet_loss_pct": 0.12,
    "bandwidth_mbps": 940,
}

# Source: SpaceX Starlink public performance reports 2022-23
STARLINK_BASELINE = {
    "latency_ms":      32.5,
    "jitter_ms":       5.1,
    "packet_loss_pct": 0.48,
    "bandwidth_mbps":  220,
}

# ── DEGRADATION PROFILE ───────────────────────────────────────────────────────
# FCC fiber congestion event traces — [time_s, lat_mult, jit_mult, loss_add_%]
DEG_PROFILE = [
    [0,   1.0,  1.0,  0.00],
    [4,   1.4,  1.9,  0.30],
    [8,   2.3,  3.4,  1.50],
    [12,  4.1,  5.2,  4.20],
    [16,  7.0,  7.8,  9.80],
    [22, 11.0, 11.0, 19.20],
    [28, 16.5, 14.0, 28.50],
]

# ── QUALITY TARGETS (from PVD) ────────────────────────────────────────────────
FAILOVER_TARGET_MS       = 50     # <50ms hitless handoff
SANDBOX_VALIDATION_SEC   = 5      # Digital twin validates in <5s
UI_RESPONSE_TARGET_SEC   = 2      # IBN dashboard responds in <2s
SYSTEM_AVAILABILITY_PCT  = 99.9   # uptime target
SCALE_TARGET_SITES       = 100    # support ≥100 network sites

# ── LOGGING ───────────────────────────────────────────────────────────────────
LOG_MAX_ENTRIES = 500
TELEMETRY_LOG_INTERVAL_SEC = 2.0
