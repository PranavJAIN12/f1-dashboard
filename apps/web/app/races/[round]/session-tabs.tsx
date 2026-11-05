import Link from "next/link";
import { formatUtcDateTime } from "@/lib/format";
import type { SessionCode, SessionInfo } from "@/lib/schemas";
import { sessionAvailability } from "@/lib/selection";
import { cn } from "@/lib/utils";

type Props = { sessions: SessionInfo[]; selected: SessionCode; round: number; year: number };

const tab = "flex h-full flex-col gap-0.5 rounded-lg border px-4 py-2.5 text-sm transition-colors";

// Only finished sessions can be opened; the rest are shown with when they happen.
export function SessionTabs({ sessions, selected, round, year }: Props) {
    return (
        <nav aria-label="Sessions">
            <ul className="flex flex-wrap gap-2">
                {sessions.map((s) => {
                    const state = sessionAvailability(s);
                    const isSelected = s.type === selected;
                    const when =
                        state === "cancelled"
                            ? "Cancelled"
                            : state === "live"
                              ? "Live window"
                              : formatUtcDateTime(s.date_start);
                    const inner = (
                        <>
                            <span className="flex items-center justify-between gap-3">
                                <span className="font-semibold">{s.name}</span>
                                <span className="font-mono text-xs opacity-70">{s.type}</span>
                            </span>
                            <span className="text-xs opacity-70">{when}</span>
                        </>
                    );
                    return (
                        <li key={s.session_key} className="min-w-[8rem] flex-1 basis-32">
                            {state === "past" && !isSelected ? (
                                <Link
                                    href={`/races/${round}?year=${year}&session=${s.type}`}
                                    aria-label={`View ${s.name}`}
                                    className={cn(
                                        tab,
                                        "bg-card text-card-foreground hover:border-border-strong hover:bg-muted",
                                    )}
                                >
                                    {inner}
                                </Link>
                            ) : (
                                <span
                                    aria-current={isSelected ? "true" : undefined}
                                    className={cn(
                                        tab,
                                        isSelected
                                            ? "border-accent/60 bg-accent-soft text-accent-soft-foreground"
                                            : "border-dashed text-muted-foreground",
                                    )}
                                >
                                    {inner}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
