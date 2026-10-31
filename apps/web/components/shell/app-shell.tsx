import { MobileNav } from "@/components/shell/mobile-nav";
import { Brand, Sidebar } from "@/components/shell/sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { env } from "@/env";
import { apiLinks } from "@/lib/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
    const links = apiLinks(env.NEXT_PUBLIC_DATA_ENGINE_URL);

    return (
        <>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-foreground"
            >
                Skip to main content
            </a>
            <div className="flex min-h-screen">
                <Sidebar apiLinks={links} />
                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-2">
                            <MobileNav apiLinks={links} />
                            <span className="lg:hidden">
                                <Brand />
                            </span>
                            <span className="hidden truncate text-xs font-medium uppercase tracking-wider text-muted-foreground lg:inline">
                                F1 Race Intelligence / Data Terminal
                            </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                            <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">
                                Historical mode
                            </span>
                            <ThemeSwitcher />
                        </div>
                    </header>
                    <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
