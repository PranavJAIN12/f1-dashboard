# Architecture

Browser -> Next.js -> FastAPI -> OpenF1 API

The frontend owns presentation. FastAPI owns data access and analytics. `app/openf1_service.py` is the only data adapter: it maps OpenF1 meetings to season rounds, throttles requests to the free-tier limit (30/min) and caches responses on disk. Data starts in 2023. PostgreSQL/Supabase stores query-friendly metadata/aggregates. Raw high-volume telemetry should use object storage/Parquet when the pipeline is expanded.
