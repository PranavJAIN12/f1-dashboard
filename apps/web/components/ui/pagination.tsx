"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
    return <nav aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
    return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

export function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
    return <li className={cn("", className)} {...props} />;
}

type PaginationLinkProps = { isActive?: boolean } & React.ComponentProps<"button">;

export function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
    return <button aria-current={isActive ? "page" : undefined} className={cn("inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white", isActive && "bg-neutral-800 text-white", className)} {...props} />;
}

export function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
    return <PaginationLink aria-label="Go to previous page" className={cn("gap-1 px-2", className)} {...props}><ChevronLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Previous</span></PaginationLink>;
}

export function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
    return <PaginationLink aria-label="Go to next page" className={cn("gap-1 px-2", className)} {...props}><span className="hidden sm:inline">Next</span> <ChevronRight className="h-3.5 w-3.5" /></PaginationLink>;
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
    return <span aria-hidden className={cn("flex h-8 w-8 items-center justify-center text-neutral-500", className)} {...props}><MoreHorizontal className="h-4 w-4" /></span>;
}