import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return (
        <div className="relative w-full overflow-x-auto">
            <table
                className={cn("w-full caption-bottom text-sm tabular-nums", className)}
                {...props}
            />
        </div>
    );
}
export function TableHeader({
    className,
    ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={cn("border-b", className)} {...props} />;
}
export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}
export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr className={cn("border-b transition-colors hover:bg-muted/60", className)} {...props} />
    );
}
export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            scope="col"
            className={cn(
                "h-10 whitespace-nowrap px-3 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground",
                className,
            )}
            {...props}
        />
    );
}
export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("p-3 align-middle text-foreground/85", className)} {...props} />;
}
