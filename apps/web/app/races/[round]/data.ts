import { cache } from "react";
import { getLaps, getPitStops, getResults, getWeather, sessionRevalidate } from "@/lib/engine";
import type { SessionCode } from "@/lib/schemas";

// React `cache` dedupes identical calls within one render, so several sections can read the same
// session data without repeating the request (the transport's abort signal opts out of fetch
// memoization). `dateEnd` is part of the key because it selects the cache lifetime.
export const loadResults = cache(
    (year: number, round: number, code: SessionCode, dateEnd: string) =>
        getResults(year, round, code, { revalidate: sessionRevalidate(dateEnd) }),
);
export const loadPitStops = cache(
    (year: number, round: number, code: SessionCode, dateEnd: string) =>
        getPitStops(year, round, code, { revalidate: sessionRevalidate(dateEnd) }),
);
export const loadLaps = cache((year: number, round: number, code: SessionCode, dateEnd: string) =>
    getLaps(year, round, code, { revalidate: sessionRevalidate(dateEnd) }),
);
export const loadWeather = cache(
    (year: number, round: number, code: SessionCode, dateEnd: string) =>
        getWeather(year, round, code, { revalidate: sessionRevalidate(dateEnd) }),
);
