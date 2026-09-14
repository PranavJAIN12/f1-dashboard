# APEX — F1 Race Intelligence

Production-oriented F1 analytics monorepo.

## Stack
- Next.js + TypeScript frontend
- FastAPI + FastF1 data engine
- PostgreSQL/Supabase schema
- Automatic OpenAPI/Swagger documentation

## Run

### Backend
```bash
cd services/data-engine
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Swagger: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
OpenAPI: http://localhost:8000/openapi.json

### Frontend
```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

Frontend: http://localhost:3000

First real F1 test:
`GET http://localhost:8000/api/v1/races/2024/8/results`

The API uses FastF1 for historical data. Live endpoints are API contracts for the later live-ingestion phase.
