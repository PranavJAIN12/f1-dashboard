import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="content" aria-busy="true">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-10 w-44" />
            <Skeleton className="mt-3 h-4 w-72" />
            <Skeleton className="mt-6 h-16 w-full" />
            <Skeleton className="mt-4 h-[32rem] w-full" />
        </div>
    );
}
