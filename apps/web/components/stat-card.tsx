import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

type Props = {
    label: string;
    icon?: LucideIcon;
    hint?: ReactNode;
    children: ReactNode;
};

export function StatCard({ label, icon: Icon, hint, children }: Props) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <div className="label">{label}</div>
                    {Icon ? (
                        <Icon
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                        />
                    ) : null}
                </div>
                <div className="value small-value">{children}</div>
                {hint ? <div className="muted">{hint}</div> : null}
            </CardHeader>
        </Card>
    );
}
