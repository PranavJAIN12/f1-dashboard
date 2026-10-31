import {
    Activity,
    ChartColumn,
    Flag,
    GitCompareArrows,
    LayoutDashboard,
    Radio,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export const primaryNav: NavItem[] = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Races", href: "/races", icon: Flag },
    { label: "Drivers", href: "/drivers", icon: Users },
    { label: "Compare", href: "/compare", icon: GitCompareArrows },
    { label: "Telemetry", href: "/telemetry", icon: Activity },
    { label: "Analytics", href: "/analytics", icon: ChartColumn },
    { label: "Live", href: "/live", icon: Radio },
];

// Same destinations the original sidebar linked to, derived from the configured engine URL.
export function apiLinks(engineUrl: string) {
    return [
        { label: "Swagger", href: new URL("/docs", engineUrl).href },
        { label: "ReDoc", href: new URL("/redoc", engineUrl).href },
    ];
}

export function isActivePath(pathname: string, href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
