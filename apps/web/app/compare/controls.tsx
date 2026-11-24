"use client";

import { cn } from "@/lib/utils";
import { bar, Choice, useNavigate, type Option } from "../telemetry/controls";

export function CompareControls({
    base,
    drivers,
    a,
    b,
}: {
    base: { year: number; round: number; session: string };
    drivers: Option[];
    a: string;
    b: string;
}) {
    const { go, pending } = useNavigate("/compare");
    const common = {
        year: String(base.year),
        round: String(base.round),
        session: base.session,
    };
    return (
        <div className={cn(bar, pending && "opacity-60 transition-opacity")} aria-busy={pending}>
            <Choice
                id="c-driver-a"
                label="Driver A"
                value={a}
                options={drivers.map((d) => ({ ...d, disabled: d.value === b }))}
                onChange={(v) => go({ ...common, a: v, b })}
            />
            <Choice
                id="c-driver-b"
                label="Driver B"
                value={b}
                options={drivers.map((d) => ({ ...d, disabled: d.value === a }))}
                onChange={(v) => go({ ...common, a, b: v })}
            />
        </div>
    );
}
