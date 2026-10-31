import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

// Native <select>: the most accessible control for a short, fixed list of options.
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => (
        <div className="relative inline-flex">
            <select
                ref={ref}
                className={cn(
                    "h-10 w-full appearance-none rounded-md border border-input bg-card pl-3 pr-9 text-sm text-foreground disabled:opacity-50",
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
        </div>
    ),
);
Select.displayName = "Select";
