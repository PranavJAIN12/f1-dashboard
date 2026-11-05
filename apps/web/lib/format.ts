export function formatLapTime(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(3).padStart(6, "0");
    return `${m}:${s}`;
}

export function formatElapsed(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Seconds relative to the session start; samples can precede it, so keep the sign.
export function formatSessionTime(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
    return `${seconds < 0 ? "-" : ""}${formatElapsed(Math.abs(seconds))}`;
}

export function formatSeconds(seconds: number | null | undefined, digits = 1): string {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
    return `${seconds.toFixed(digits)} s`;
}

export function formatUtcTime(iso: string): string {
    return new Date(iso).toISOString().slice(11, 19);
}

export function formatUtcDate(iso: string): string {
    return new Date(iso).toISOString().slice(0, 10);
}

const dayMonth = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
});

// "6-8 Mar" within one month, "30 Mar - 1 Apr" across months. UTC keeps server and client equal.
export function formatDateRange(startIso: string, endIso: string): string {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (
        start.getUTCMonth() !== end.getUTCMonth() ||
        start.getUTCFullYear() !== end.getUTCFullYear()
    )
        return `${dayMonth.format(start)} \u2013 ${dayMonth.format(end)}`;
    if (start.getUTCDate() === end.getUTCDate()) return dayMonth.format(start);
    return `${start.getUTCDate()}\u2013${dayMonth.format(end)}`;
}

// "20 Apr, 15:00 UTC".
export function formatUtcDateTime(iso: string): string {
    const date = new Date(iso);
    return `${dayMonth.format(date)}, ${date.toISOString().slice(11, 16)} UTC`;
}
