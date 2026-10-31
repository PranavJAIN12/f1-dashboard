"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Select } from "@/components/ui/select";

const noopSubscribe = () => () => {};

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    // False on the server and during hydration, true afterwards: avoids a mismatch
    // because the stored theme is only known in the browser.
    const mounted = useSyncExternalStore(
        noopSubscribe,
        () => true,
        () => false,
    );

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="theme-select" className="text-xs font-medium text-muted-foreground">
                Theme
            </label>
            <Select
                id="theme-select"
                className="h-9"
                value={mounted ? (theme ?? "system") : "system"}
                onChange={(event) => setTheme(event.target.value)}
                disabled={!mounted}
            >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </Select>
        </div>
    );
}
