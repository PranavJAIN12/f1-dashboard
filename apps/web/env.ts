import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        DATA_ENGINE_URL: z.url().default("http://localhost:8000"),
    },
    client: {
        NEXT_PUBLIC_DATA_ENGINE_URL: z.url().default("http://localhost:8000"),
    },
    runtimeEnv: {
        DATA_ENGINE_URL: process.env.DATA_ENGINE_URL,
        NEXT_PUBLIC_DATA_ENGINE_URL: process.env.NEXT_PUBLIC_DATA_ENGINE_URL,
    },
    // Treat `VAR=` in .env files as unset so defaults apply.
    emptyStringAsUndefined: true,
});
