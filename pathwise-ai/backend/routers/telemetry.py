"""
routers/telemetry.py — Live telemetry endpoints
"""
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import asyncio, json

router = APIRouter()


@router.get("/snapshot")
async def get_snapshot(request: Request):
    """Single telemetry snapshot — used by frontend polling."""
    sim = request.app.state.sim if hasattr(request.app.state, "sim") else None
    # Fallback: get sim from app extra
    from main import sim as global_sim
    s = global_sim
    s.tick()
    return s.snapshot()


@router.get("/stream")
async def telemetry_stream(request: Request):
    """
    Server-Sent Events stream — pushes telemetry every 500ms.
    Frontend can subscribe with EventSource('/api/telemetry/stream')
    """
    from main import sim as global_sim

    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            global_sim.tick()
            data = json.dumps(global_sim.snapshot())
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/logs")
async def get_logs():
    """Return last 200 backend log entries."""
    from main import sim as global_sim
    return {"logs": global_sim.get_logs()}
