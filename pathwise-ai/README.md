# PathWise AI
**Predictive SD-WAN Intelligence Platform — Team Pathfinders 2026**

AI-powered SD-WAN that predicts network degradation 30–60 seconds before it occurs and executes a **hitless Fiber→Starlink handoff** with zero packet loss.

---

## Project Structure

```
pathwise-ai/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point, CORS, router registration
│   ├── requirements.txt      # Python dependencies
│   ├── core/
│   │   └── sim_engine.py     # Simulation engine (telemetry, LSTM, state machine)
│   ├── models/
│   │   └── schemas.py        # Pydantic data models
│   └── routers/
│       ├── telemetry.py      # GET /api/telemetry/snapshot + SSE stream
│       ├── demo.py           # POST /api/demo/start|reset, GET /api/demo/state
│       └── lstm.py           # GET /api/lstm/prediction|config
│
├── frontend/                 # Vanilla JS + CSS frontend
│   ├── index.html            # Main HTML shell
│   └── src/
│       ├── app.js            # Main controller — dual mode (backend/standalone)
│       ├── components/
│       │   ├── Banner.js     # Phase status banner
│       │   ├── LinkCards.js  # Fiber / Starlink WAN card updater
│       │   ├── Timeline.js   # Event timeline state machine
│       │   ├── LSTM.js       # LSTM confidence bar + table
│       │   └── BackendPanel.js # Raw values table + log stream
│       ├── utils/
│       │   ├── helpers.js    # fmt(), healthColor(), latColor(), el()
│       │   ├── chart.js      # Canvas-based real-time telemetry chart
│       │   └── voip.js       # VoIP waveform animation
│       └── styles/
│           ├── main.css      # CSS variables, layout, idle screen
│           ├── components.css # Cards, buttons, links, chart, video
│           └── backend-panel.css # Raw values table + log stream styles
│
├── config/
│   └── settings.py           # Centralized config (ports, thresholds, baselines)
│
├── .gitignore
└── README.md
```

---

## Quick Start

### Option A — Frontend Only (no server needed)
Open `frontend/index.html` directly in your browser. The app runs a built-in JS simulation engine with no backend required.

### Option B — Full Stack (FastAPI + Frontend)

**1. Backend**
```bash
cd backend
pip install -r requirements.txt
python main.py
# → API running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

**2. Frontend**
```bash
cd frontend
python -m http.server 3000
# → Open http://localhost:3000
```
Then in `frontend/src/app.js`, set:
```js
const USE_BACKEND = true;
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/demo/start` | Start the demo simulation |
| POST | `/api/demo/reset` | Reset to idle |
| GET  | `/api/demo/state` | Current phase/state summary |
| GET  | `/api/telemetry/snapshot` | Full telemetry snapshot (polled every 500ms) |
| GET  | `/api/telemetry/stream` | Server-Sent Events stream |
| GET  | `/api/telemetry/logs` | Last 200 backend log entries |
| GET  | `/api/lstm/prediction` | Current LSTM confidence + alert |
| GET  | `/api/lstm/config` | LSTM model configuration |
| GET  | `/health` | Health check |
| GET  | `/docs` | Swagger UI |

---

## Demo Flow (Fully Autonomous)

```
T+00s   Demo starts — both Fiber and Starlink links go live
T+15s   AUTO: Fiber congestion event fires (FCC degradation curve)
T+23s   LSTM confidence crosses 85% → PathWise alert fires
T+27s   LSTM confidence crosses 92% → Hitless switch to Starlink
        SDN flow tables updated · Session state preserved · <50ms · 0 packets dropped
```

---

## Data Sources

| Source | Used For |
|--------|----------|
| FCC Measuring Broadband America 2023 | Fiber FTTH baseline (lat/jit/loss) |
| SpaceX Starlink public reports 2022-23 | Starlink baseline + beam-handoff pattern |
| ITU-T G.114 | VoIP quality thresholds |
| OpenSignal 2023 Global Report | Mobile/wireless benchmarks |
| FCC fiber congestion event traces | Degradation curve waypoints |

---

## Key Features

| Feature | Priority | Status |
|---------|----------|--------|
| Predictive Telemetry Engine (LSTM) | High | ✅ Implemented |
| Autonomous Traffic Steering (Hitless Handoff) | High | ✅ Implemented |
| Digital Twin Validation Sandbox | High | 🔧 Planned (Mininet/Batfish) |
| Multi-Link Health Scoreboard | Medium | ✅ Implemented |
| Intent-Based Management Interface (IBN) | Low | ✅ Implemented |

---

## Team Pathfinders

| Name | Role |
|------|------|
| Vineeth Reddy Kodakandla | Project Manager |
| Sricharitha Katta | Technical Manager / Configuration Manager |
| Meghana Nalluri | Requirements Manager |
| Bharadwaj Jakkula | Design Manager / Test Manager |
