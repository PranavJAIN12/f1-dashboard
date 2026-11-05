import { CircleSlash, Clock, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EngineError, EngineErrorKind } from "@/lib/engine";

export type StateTone = "invalid" | "missing" | "unavailable" | "empty" | "failure";

const tones: Record<StateTone, { icon: LucideIcon; title: string; role: "status" | "alert" }> = {
    invalid: { icon: CircleSlash, title: "Invalid selection", role: "alert" },
    missing: { icon: CircleSlash, title: "Not found", role: "status" },
    unavailable: { icon: Clock, title: "Not available", role: "status" },
    empty: { icon: Info, title: "No data", role: "status" },
    failure: { icon: TriangleAlert, title: "Could not load", role: "alert" },
};

// Maps a transport failure to a presentation: a failed request is never shown as empty data.
export function toneFor(kind: EngineErrorKind): StateTone {
    switch (kind) {
        case "invalid_input":
            return "invalid";
        case "not_found":
            return "missing";
        case "unavailable":
            return "unavailable";
        default:
            return "failure";
    }
}

export function StateMessage({
    tone,
    title,
    children,
    bare = false,
}: {
    tone: StateTone;
    title?: string;
    children: React.ReactNode;
    bare?: boolean;
}) {
    const { icon: Icon, title: defaultTitle, role } = tones[tone];
    const body = (
        <div role={role} className="flex items-start gap-3">
            <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
                <p className="text-sm font-medium">{title ?? defaultTitle}</p>
                <p className="muted">{children}</p>
            </div>
        </div>
    );
    return bare ? (
        body
    ) : (
        <Card className="section">
            <CardContent className="pt-5">{body}</CardContent>
        </Card>
    );
}

export function ErrorState({ error, bare }: { error: EngineError; bare?: boolean }) {
    const retry =
        error.kind === "rate_limited" && error.options.retryAfter
            ? ` Try again in about ${Math.ceil(error.options.retryAfter)} seconds.`
            : error.kind === "provider" || error.kind === "engine" || error.kind === "timeout"
              ? " Reload the page to try again."
              : "";
    return (
        <StateMessage tone={toneFor(error.kind)} bare={bare}>
            {error.message}
            {retry}
        </StateMessage>
    );
}
