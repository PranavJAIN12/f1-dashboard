import Image from "next/image";
import { formatLapTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { SessionResult } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function Avatar({ src, initials }: { src: string | null; initials: string }) {
    return src ? (
        <Image
            src={src}
            alt=""
            width={56}
            height={56}
            // Loaded by the browser, not Next's optimizer, which would fetch from the server and
            // fail behind proxies whose CA Node does not trust. The source is already thumbnail-sized.
            unoptimized
            className="size-14 shrink-0 rounded-full bg-muted object-cover object-top"
        />
    ) : (
        <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground"
        >
            {initials}
        </span>
    );
}

function GridChange({ grid, position }: { grid: number | null; position: number | null }) {
    if (grid === null) return <>-</>;
    const gained = position === null ? 0 : grid - position;
    return (
        <span className="flex items-baseline gap-1.5">
            P{grid}
            {gained !== 0 ? (
                <span
                    className={cn(
                        "text-xs font-medium",
                        gained > 0 ? "text-success" : "text-accent-soft-foreground",
                    )}
                >
                    <span aria-hidden="true">{gained > 0 ? "\u25B2" : "\u25BC"}</span>
                    {Math.abs(gained)}
                    <span className="sr-only">
                        {gained > 0 ? " places gained" : " places lost"}
                    </span>
                </span>
            ) : null}
        </span>
    );
}

// Renders an <li>: place it inside a <ul>.
export function DriverCard({ driver }: { driver: SessionResult }) {
    const name = driver.full_name ?? driver.abbreviation;
    const finished = driver.status === "Finished";
    return (
        <li className="flex">
            <article
                className={cn(
                    "flex w-full flex-col gap-4 rounded-lg border bg-card p-5 transition-all duration-200",
                    "hover:border-border-strong hover:shadow-lg",
                    driver.position === 1 && "border-accent/60 ring-1 ring-accent/30",
                )}
            >
                <div className="flex items-start gap-3">
                    <Avatar src={driver.headshot_url} initials={driver.abbreviation} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold tracking-wider text-accent-soft-foreground">
                                    {driver.position === null ? "-" : `P${driver.position}`}
                                </span>
                                {!finished ? (
                                    <Badge variant="secondary">{driver.status}</Badge>
                                ) : null}
                            </span>
                            <span className="text-sm font-bold">{driver.abbreviation}</span>
                        </div>
                        <h2 className="mt-1 truncate text-base font-semibold leading-snug">
                            {name}
                        </h2>
                        <p className="truncate text-sm text-muted-foreground">
                            {driver.team ?? "Unknown team"}
                        </p>
                    </div>
                </div>
                <dl className="mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-sm">
                    <div>
                        <dt className="label">Points</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">
                            {driver.points === null ? "-" : driver.points}
                        </dd>
                    </div>
                    <div>
                        <dt className="label">Grid</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">
                            <GridChange grid={driver.grid} position={driver.position} />
                        </dd>
                    </div>
                    <div>
                        <dt className="label">Best lap</dt>
                        <dd className="mt-0.5 font-mono text-xs font-semibold tabular-nums">
                            {formatLapTime(driver.fastest_lap)}
                        </dd>
                    </div>
                </dl>
            </article>
        </li>
    );
}
