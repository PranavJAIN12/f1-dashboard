import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        DATA_ENGINE_URL: z.url().default("http://localhost:8000"),
        // Season shown by the dashboard. OpenF1 has data from 2023.
        DEFAULT_SEASON: z.coerce.number().int().min(2023).max(2100).default(2026),
    },
    client: {
        NEXT_PUBLIC_DATA_ENGINE_URL: z.url().default("http://localhost:8000"),
    },
    runtimeEnv: {
        DATA_ENGINE_URL: process.env.DATA_ENGINE_URL,
        DEFAULT_SEASON: process.env.DEFAULT_SEASON,
        NEXT_PUBLIC_DATA_ENGINE_URL: process.env.NEXT_PUBLIC_DATA_ENGINE_URL,
    },
    // Treat `VAR=` in .env files as unset so defaults apply.
    emptyStringAsUndefined: true,
});
