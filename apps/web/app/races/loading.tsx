import { ScheduleSkeleton } from "@/components/schedule-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="content" aria-busy="true">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-10 w-40" />
            <Skeleton className="mt-3 h-4 w-56" />
            <ScheduleSkeleton />
        </div>
    );
}
