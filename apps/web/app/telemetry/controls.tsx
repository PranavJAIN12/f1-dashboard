"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ReactNode } from "react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string; disabled?: boolean };
type Params = Record<string, string | undefined>;

// All selections live in the URL so a view can be shared and renders on the server.
function useNavigate() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const go = (params: Params) => {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params))
            if (value !== undefined) query.set(key, value);
        startTransition(() => router.push(`/telemetry?${query}`));
    };
    return { go, pending };
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <label className="label" htmlFor={id}>
                {label}
            </label>
            {children}
        </div>
    );
}

function Choice({
    id,
    label,
    value,
    options,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
}) {
    return (
        <Field id={id} label={label}>
            <Select
                id={id}
                value={value}
                className="min-w-36"
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value} disabled={o.disabled}>
                        {o.label}
                    </option>
                ))}
            </Select>
        </Field>
    );
}

const bar = "flex flex-wrap items-end gap-x-4 gap-y-3";

export function SessionControls({
    year,
    round,
    session,
    seasons,
    rounds,
    sessions,
}: {
    year: number;
    round: number;
    session: string;
    seasons: number[];
    rounds: Option[];
    sessions: Option[];
}) {
    const { go, pending } = useNavigate();
    return (
        <div className={cn(bar, pending && "opacity-60 transition-opacity")} aria-busy={pending}>
            <Choice
                id="t-season"
                label="Season"
                value={String(year)}
                options={seasons.map((s) => ({ value: String(s), label: String(s) }))}
                onChange={(v) => go({ year: v })}
            />
            <Choice
                id="t-round"
                label="Race"
                value={String(round)}
                options={rounds}
                onChange={(v) => go({ year: String(year), round: v })}
            />
            <Choice
                id="t-session"
                label="Session"
                value={session}
                options={sessions}
                onChange={(v) => go({ year: String(year), round: String(round), session: v })}
            />
        </div>
    );
}

export function DriverControls({
    base,
    drivers,
    a,
    b,
    lapsA,
    lapsB,
    lapA,
    lapB,
}: {
    base: { year: number; round: number; session: string };
    drivers: Option[];
    a: string;
    b: string; // "none" when no second driver is compared
    lapsA: Option[];
    lapsB: Option[];
    lapA: string;
    lapB: string | undefined;
}) {
    const { go, pending } = useNavigate();
    const common = {
        year: String(base.year),
        round: String(base.round),
        session: base.session,
    };
    const forB = (code: string) => drivers.map((d) => ({ ...d, disabled: d.value === code }));
    return (
        <div className={cn(bar, pending && "opacity-60 transition-opacity")} aria-busy={pending}>
            <Choice
                id="t-driver-a"
                label="Driver A"
                value={a}
                options={drivers.map((d) => ({ ...d, disabled: d.value === b }))}
                onChange={(v) => go({ ...common, a: v, b, lapB })}
            />
            <Choice
                id="t-lap-a"
                label="Lap A"
                value={lapA}
                options={lapsA}
                onChange={(v) => go({ ...common, a, b, lapA: v, lapB })}
            />
            <Choice
                id="t-driver-b"
                label="Driver B"
                value={b}
                options={[{ value: "none", label: "No comparison" }, ...forB(a)]}
                onChange={(v) => go({ ...common, a, lapA, b: v })}
            />
            {lapB !== undefined ? (
                <Choice
                    id="t-lap-b"
                    label="Lap B"
                    value={lapB}
                    options={lapsB}
                    onChange={(v) => go({ ...common, a, lapA, b, lapB: v })}
                />
            ) : null}
        </div>
    );
}
