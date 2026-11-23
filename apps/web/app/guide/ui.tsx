import { ArrowUp, CalendarClock, CircleHelp, FlaskConical, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Scope = "general" | "2026" | "hypothetical" | "confirm";

const scopes: Record<Scope, { label: string; className: string }> = {
    general: { label: "General", className: "border-border bg-muted text-muted-foreground" },
    "2026": {
        label: "2026 season rule",
        className: "border-transparent bg-accent-soft text-accent-soft-foreground",
    },
    hypothetical: {
        label: "Hypothetical example",
        className: "border-dashed border-border-strong text-foreground",
    },
    confirm: { label: "To confirm", className: "border-accent/60 text-accent-soft-foreground" },
};

// A span, not the shared Badge, because Badge renders a div and cannot sit inside a paragraph.
export function Tag({ scope }: { scope: Scope }) {
    const { label, className } = scopes[scope];
    return (
        <span
            className={cn(
                "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold",
                className,
            )}
        >
            {label}
        </span>
    );
}

export type CalloutKind = "note" | "season" | "hypothetical" | "confirm";

const callouts: Record<CalloutKind, { icon: LucideIcon; className: string }> = {
    note: { icon: Info, className: "border-border bg-muted/60" },
    season: { icon: CalendarClock, className: "border-accent/40 bg-accent-soft" },
    hypothetical: { icon: FlaskConical, className: "border-dashed border-border-strong bg-card" },
    confirm: { icon: CircleHelp, className: "border-accent/60 bg-card" },
};

export function Callout({
    kind,
    title,
    children,
}: {
    kind: CalloutKind;
    title: string;
    children: ReactNode;
}) {
    const { icon: Icon, className } = callouts[kind];
    return (
        <div role="note" className={cn("flex gap-3 rounded-lg border p-4 text-sm", className)}>
            <Icon
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-accent-soft-foreground"
            />
            <div className="min-w-0 space-y-2">
                <p className="font-semibold">{title}</p>
                <div className="space-y-2 text-foreground/85">{children}</div>
            </div>
        </div>
    );
}

export function Section({
    id,
    number,
    kicker,
    title,
    children,
}: {
    id: string;
    number: string;
    kicker: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section id={id} aria-labelledby={`${id}-heading`} className="mt-16 scroll-mt-24">
            <header className="mb-6 border-b pb-4">
                <div className="flex items-center gap-3">
                    <span
                        aria-hidden="true"
                        className="font-mono text-sm font-bold text-accent-soft-foreground"
                    >
                        {number}
                    </span>
                    <span aria-hidden="true" className="h-px w-8 bg-accent" />
                    <span className="eyebrow">{kicker}</span>
                </div>
                <h2
                    id={`${id}-heading`}
                    className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                >
                    {title}
                </h2>
            </header>
            <div className="flex flex-col gap-6">{children}</div>
            <p className="mt-8 text-right text-xs">
                <a
                    href="#contents"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                    <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                    Back to contents
                </a>
            </p>
        </section>
    );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
    return (
        <h3 id={id} className="scroll-mt-24 text-lg font-semibold tracking-tight">
            {children}
        </h3>
    );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <p
            className={cn(
                "max-w-prose text-[0.95rem] leading-relaxed text-foreground/90",
                className,
            )}
        >
            {children}
        </p>
    );
}

export function BulletList({ children }: { children: ReactNode }) {
    return (
        <ul className="max-w-prose list-disc space-y-1.5 pl-5 text-[0.95rem] leading-relaxed text-foreground/90 marker:text-accent-soft-foreground">
            {children}
        </ul>
    );
}

export function InfoCard({
    icon: Icon,
    title,
    children,
    tag,
}: {
    icon?: LucideIcon;
    title: string;
    children: ReactNode;
    tag?: Scope;
}) {
    return (
        <div className="flex h-full flex-col gap-3 rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
                {Icon ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-soft-foreground">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                ) : null}
                {tag ? <Tag scope={tag} /> : null}
            </div>
            <h3 className="text-base font-semibold">{title}</h3>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {children}
            </div>
        </div>
    );
}

export function Figure({
    caption,
    children,
    scrollHint = false,
    className,
}: {
    caption: ReactNode;
    children: ReactNode;
    // Wide diagrams scroll sideways on narrow screens instead of shrinking their text.
    scrollHint?: boolean;
    className?: string;
}) {
    return (
        <figure className={cn("min-w-0 rounded-lg border bg-card p-4 sm:p-5", className)}>
            {children}
            <figcaption className="mt-3 text-sm text-muted-foreground">
                {scrollHint ? (
                    <span className="mb-1 block text-xs font-medium sm:hidden">
                        Scroll sideways to see the whole diagram.
                    </span>
                ) : null}
                {caption}
            </figcaption>
        </figure>
    );
}

export function KerbStripe() {
    return (
        <div
            aria-hidden="true"
            className="h-1.5 w-full rounded-full bg-[repeating-linear-gradient(90deg,hsl(var(--accent))_0_14px,hsl(var(--card))_14px_28px)]"
        />
    );
}

export function Kbd({ children }: { children: ReactNode }) {
    return (
        <code className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.8em]">
            {children}
        </code>
    );
}
