# APEX — F1 Race Intelligence

Production-oriented F1 analytics monorepo.

## Stack
- Next.js + TypeScript frontend
- FastAPI data engine backed by OpenF1
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

#### MCP server (chatbot tool access)

The data engine's REST API is also exposed as MCP (Model Context Protocol) tools, so an LLM
chatbot can query race, driver, team, analytics and telemetry data directly. The MCP server
calls the FastAPI app in-process (no separate HTTP server needs to be running) and reuses its
validation, response contracts and error handling.

```bash
cd services/data-engine
source .venv/bin/activate
python -m app.mcp
```

This starts the server on stdio, the transport MCP clients (e.g. Claude Desktop, VS Code) use
to launch tool servers as a subprocess. Point a client's MCP config at
`python -m app.mcp` with `cwd` set to `services/data-engine`.

Tool definitions live in `services/data-engine/app/mcp/server.py` (19 tools: races, drivers, teams,
analytics, telemetry). Responses are returned in full, never truncated. See `app/mcp/client.py` for the
in-process HTTP bridge.

#### Chat endpoint (Ollama + MCP tools, streamed)

The FastAPI app also serves a chat endpoint that runs a local Ollama model with the MCP tools and
streams everything as server-sent events.

```bash
ollama serve                      # and `ollama pull gpt-oss:20b` once
uvicorn app.main:app --reload --port 8000

curl -N -X POST http://localhost:8000/api/v1/chat -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"Who won the 2024 Bahrain GP?"}]}'
curl http://localhost:8000/api/v1/chat/status   # Ollama reachable? model installed?
```

The request is stateless: send the whole conversation as `messages` (`user` / `assistant`, last one
must be `user`). Optional `model` overrides `OLLAMA_MODEL`. Events (`event:` name, JSON `data:`):

| Event         | Data                                         | Meaning                                    |
| ------------- | -------------------------------------------- | ------------------------------------------ |
| `token`       | `{content}`                                  | Answer text delta                          |
| `thinking`    | `{content}`                                  | Reasoning delta (models that expose it)    |
| `tool_call`   | `{id, name, arguments}`                      | The model called a tool                    |
| `tool_result` | `{id, name, is_error, content}`              | Full tool output (JSON text, not trimmed)  |
| `done`        | `{model, rounds}`                            | Finished                                   |
| `error`       | `{message}`                                  | Failed; the stream ends                    |

Use `fetch` + a stream reader on the frontend (`EventSource` cannot send a POST body).

Models must support native tool calling. `gpt-oss:20b` was verified end to end; `llama3.2` (3B) wrote
tool calls as plain text instead of calling them, so avoid very small models. Large tools (telemetry)
return hundreds of KB, so `OLLAMA_NUM_CTX` (default 32768) matters: Ollama drops the oldest context
silently when it is exceeded.

| Variable          | Default                  | Purpose                  |
| ----------------- | ------------------------ | ------------------------ |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server            |
| `OLLAMA_MODEL`    | `gpt-oss:20b`            | Default chat model       |
| `OLLAMA_NUM_CTX`  | `32768`                  | Context window in tokens |

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

#### Data source

All race data comes from [OpenF1](https://openf1.org): schedule, results, laps, tyre stints, pit stops, weather and car telemetry. No account or API key is needed.

- **Coverage:** 2023 season onwards (historical sessions only). Live data requires a paid OpenF1 plan and is not wired up; the `/live` endpoints are placeholders.
- **Rate limit:** the free tier allows 30 requests/minute, so responses are cached on disk (`OPENF1_CACHE_DIR`, default `.openf1-cache`) and requests are throttled. The first load of a race is slower; repeat loads are served from the cache.
- **License:** OpenF1 data is for non-commercial use.
- **TLS:** HTTPS uses the operating system trust store (`truststore`), so corporate proxy certificates work without disabling verification.

Backend environment variables (`services/data-engine`):

| Variable           | Default                     | Purpose                         |
| ------------------ | --------------------------- | ------------------------------- |
| `OPENF1_CACHE_DIR` | `.openf1-cache`             | Disk cache for OpenF1 responses |
| `OPENF1_BASE_URL`  | `https://api.openf1.org/v1` | Override the API base URL       |
| `CORS_ORIGINS`     | `http://localhost:3000`     | Comma-separated allowed origins |

Live endpoints are API contracts for the later live-ingestion phase.
