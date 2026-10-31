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

Requires Node.js 24 LTS (`apps/web/.nvmrc`; enforced through `engines` and `engine-strict`). With nvm: `nvm use`.

```bash
cd apps/web
npm ci
cp .env.example .env.local
npm run dev
```

Frontend: http://localhost:3000

Use `npm ci` (not `npm install`) so the committed `package-lock.json` is respected.

Environment variables are validated in `apps/web/env.ts` (`@t3-oss/env-nextjs` + Zod). An invalid value stops `next dev` / `next build` with an error naming the variable.

| Variable                      | Scope                      | Default                 |
| ----------------------------- | -------------------------- | ----------------------- |
| `DATA_ENGINE_URL`             | Server only (never bundled) | `http://localhost:8000` |
| `NEXT_PUBLIC_DATA_ENGINE_URL` | Public (inlined at build)  | `http://localhost:8000` |

Empty values (`VAR=`) are treated as unset. Do not store secrets in `NEXT_PUBLIC_` variables.

Quality checks (run from `apps/web`):

```bash
npm run format:check   # Prettier (use `npm run format` to fix)
npm run lint           # ESLint flat config (eslint-config-next + TypeScript rules)
npm run typecheck      # next typegen && tsc --noEmit (strict mode)
npm run build          # production build
```

`next lint` was removed in Next.js 16, so `lint` runs ESLint directly. ESLint stays on 9.x because the `eslint-config-next` plugins do not yet support ESLint 10.

First real F1 test:
`GET http://localhost:8000/api/v1/races/2024/8/results`

The API uses FastF1 for historical data. Live endpoints are API contracts for the later live-ingestion phase.
