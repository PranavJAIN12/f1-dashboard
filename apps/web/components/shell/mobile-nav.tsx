"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand, NavigationContent } from "@/components/shell/sidebar";

type ApiLink = { label: string; href: string };

export function MobileNav({ apiLinks }: { apiLinks: ApiLink[] }) {
    const [open, setOpen] = useState(false);

    // The persistent sidebar takes over at lg, so a still-open modal would be stale.
    useEffect(() => {
        const query = window.matchMedia("(min-width: 1024px)");
        const closeOnDesktop = (event: MediaQueryListEvent) => {
            if (event.matches) setOpen(false);
        };
        query.addEventListener("change", closeOnDesktop);
        return () => query.removeEventListener("change", closeOnDesktop);
    }, []);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                    <Menu aria-hidden="true" className="h-5 w-5" />
                </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay/60 lg:hidden" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r bg-surface px-3 py-4 lg:hidden">
                    <div className="mb-6 flex items-center justify-between px-3">
                        <Dialog.Title asChild>
                            <span>
                                <Brand />
                                <span className="sr-only"> navigation</span>
                            </span>
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" aria-label="Close menu">
                                <X aria-hidden="true" className="h-5 w-5" />
                            </Button>
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">
                        Navigate between APEX sections.
                    </Dialog.Description>
                    <NavigationContent apiLinks={apiLinks} onNavigate={() => setOpen(false)} />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
