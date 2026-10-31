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

#### Design system and app shell

- **Theme tokens** live in `apps/web/app/globals.css` (`:root` for light, `.dark` for dark) and are exposed as Tailwind utilities in `apps/web/tailwind.config.js` (`bg-card`, `text-muted-foreground`, `border-border`, `bg-accent`, ...). Use these instead of raw palette colors.
- **Theme switching** uses `next-themes` (class strategy, system default). The selection is stored in `localStorage` under `theme`.
- **Shell** (`apps/web/components/shell/`): sticky sidebar from 1024px; below that, a Radix Dialog drawer. Navigation items are defined once in `apps/web/lib/navigation.ts`.
- **Fonts:** Geist Sans and Geist Mono (SIL OFL) via the `geist` package, bundled locally.
- The legacy utility classes used by pages (`.content`, `.card`, `.grid.four`, ...) remain in `globals.css`, now token-based and mobile-first.

First real F1 test:
`GET http://localhost:8000/api/v1/races/2024/8/results`

The API uses FastF1 for historical data. Live endpoints are API contracts for the later live-ingestion phase.
