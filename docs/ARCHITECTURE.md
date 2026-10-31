# Architecture

Browser -> Next.js -> FastAPI -> FastF1

The frontend owns presentation. FastAPI owns data access and analytics. FastF1 cache stores downloaded session data. PostgreSQL/Supabase stores query-friendly metadata/aggregates. Raw high-volume telemetry should use object storage/Parquet when the pipeline is expanded.
