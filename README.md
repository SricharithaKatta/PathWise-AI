# PathWise AI Demo (Full Stack)

A runnable demo of an SD-WAN telemetry + predictive link-health dashboard:
- JWT login
- Link CRUD
- Telemetry ingestion (latency/jitter/packet loss)
- Predictive "brownout risk" scoring (simple predictor stub - replace with LSTM later)
- Intent-based policies
- Routing decisions log

## Tech
- Frontend: React + Vite
- Backend: Node.js + Express
- DB: PostgreSQL + Prisma
- Dev DB: Docker Compose

---

## Quick Start (Recommended)

### 1) Start PostgreSQL
From project root:
```bash
docker compose up -d
