import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
    {
        variants: {
            variant: {
                default: "border-transparent bg-foreground text-background",
                secondary: "border-border bg-muted text-muted-foreground",
                outline: "border-border-strong bg-transparent text-foreground",
                accent: "border-transparent bg-accent-soft text-accent-soft-foreground",
            },
        },
        defaultVariants: { variant: "default" },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
