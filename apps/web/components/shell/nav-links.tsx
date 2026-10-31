"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, primaryNav } from "@/lib/navigation";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <ul className="grid gap-1">
            {primaryNav.map(({ label, href, icon: Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                    <li key={href}>
                        <Link
                            href={href}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "flex h-10 items-center gap-3 rounded-md border-l-2 px-3 text-sm font-medium transition-colors",
                                active
                                    ? "border-accent bg-muted text-foreground"
                                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                            {label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
