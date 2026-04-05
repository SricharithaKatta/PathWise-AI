"""
PathWise AI — FastAPI Backend
Team Pathfinders 2026

Serves real-time network telemetry, LSTM prediction engine,
and autonomous traffic steering simulation.

Data baselines sourced from:
  - FCC Measuring Broadband America 2023
  - SpaceX Starlink public performance reports 2022-23
  - ITU-T G.114 VoIP quality thresholds
  - OpenSignal 2023 Global Mobile Report
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os

from routers import telemetry, demo, lstm
from core.sim_engine import SimEngine

app = FastAPI(
    title="PathWise AI",
    description="Predictive SD-WAN Intelligence Platform",
    version="1.3.0"
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared simulation engine instance
sim = SimEngine()

# Inject sim into routers
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])
app.include_router(demo.router,      prefix="/api/demo",      tags=["Demo Control"])
app.include_router(lstm.router,      prefix="/api/lstm",      tags=["LSTM Engine"])

# Serve built frontend (for production)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.3.0", "service": "PathWise AI"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
