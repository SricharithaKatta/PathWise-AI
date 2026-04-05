"""
models/schemas.py — PathWise AI Pydantic Schemas
"""
from pydantic import BaseModel
from typing import Optional


class LinkMetrics(BaseModel):
    lat: float
    jit: float
    loss: float
    health: float
    bw: int


class LSTMOutput(BaseModel):
    conf: float
    hor: int
    alert: bool


class PathwiseState(BaseModel):
    alerted: bool
    alert_t: float
    switched: bool
    switch_t: float
    pkts_avoided: int


class DegProfile(BaseModel):
    lat_mult: float
    jit_mult: float
    loss_add: float


class Flags(BaseModel):
    would_buffer: bool
    voip_dropping: bool


class LogEntry(BaseModel):
    t: float
    msg: str
    level: str  # info | warn | alert | switch | success | system | data


class SimState(BaseModel):
    elapsed: float
    phase: str
    active_link: str
    running: bool
    countdown: float
    fiber: dict
    starlink: dict
    lstm: dict
    pathwise: dict
    deg_profile: dict
    flags: dict
    logs: list


class DemoStartResponse(BaseModel):
    status: str
    message: str


class ResetResponse(BaseModel):
    status: str
