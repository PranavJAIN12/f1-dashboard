import { cache } from "react";
import { getTelemetry, sessionRevalidate } from "@/lib/engine";
import type { SessionCode } from "@/lib/schemas";

// Results and laps loaders are shared with the race page, so one render never repeats a request.
export { loadLaps, loadResults } from "../races/[round]/data";

export const loadTelemetry = cache(
    (
        year: number,
        round: number,
        code: SessionCode,
        driver: string,
        lap: number,
        dateEnd: string,
    ) => getTelemetry(year, round, code, driver, lap, { revalidate: sessionRevalidate(dateEnd) }),
);
