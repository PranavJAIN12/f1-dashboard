import { ExternalLink } from "lucide-react";
import { NavLinks } from "@/components/shell/nav-links";

type ApiLink = { label: string; href: string };

export function Brand() {
    return (
        <span className="text-lg font-extrabold tracking-[0.2em]">
            APEX
            <span aria-hidden="true" className="text-accent-soft-foreground">
                .
            </span>
        </span>
    );
}

// Shared by the desktop sidebar and the mobile drawer so both stay identical.
export function NavigationContent({
    apiLinks,
    onNavigate,
}: {
    apiLinks: ApiLink[];
    onNavigate?: () => void;
}) {
    return (
        <>
            <nav aria-label="Primary">
                <p className="label mb-2 px-3">Workspace</p>
                <NavLinks onNavigate={onNavigate} />
            </nav>
            <nav aria-label="API documentation" className="mt-6">
                <p className="label mb-2 px-3">API</p>
                <ul className="grid gap-1">
                    {apiLinks.map(({ label, href }) => (
                        <li key={href}>
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 items-center gap-3 rounded-md border-l-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                {label}
                                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}

export function Sidebar({ apiLinks }: { apiLinks: ApiLink[] }) {
    return (
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r bg-surface px-3 py-6 lg:flex">
            <div className="mb-8 px-3">
                <Brand />
            </div>
            <NavigationContent apiLinks={apiLinks} />
        </aside>
    );
}
