"""
routers/demo.py — Demo lifecycle control endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/start")
def start_demo():
    """Start the PathWise AI demo simulation."""
    from main import sim
    sim.start()
    return {"status": "started", "message": "PathWise AI demo engine started. Auto-degradation fires at T+15s."}


@router.post("/reset")
def reset_demo():
    """Reset simulation to idle state."""
    from main import sim
    sim.reset()
    return {"status": "reset", "message": "Simulation reset to idle."}


@router.get("/state")
def get_state():
    """Get current demo state summary."""
    from main import sim
    snap = sim.snapshot()
    return {
        "phase":       snap["phase"],
        "active_link": snap["active_link"],
        "elapsed":     snap["elapsed"],
        "alerted":     snap["pathwise"]["alerted"],
        "switched":    snap["pathwise"]["switched"],
        "running":     snap["running"],
    }
