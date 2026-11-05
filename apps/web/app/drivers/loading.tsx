import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="content" aria-busy="true">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-3 h-10 w-44" />
            <Skeleton className="mt-3 h-4 w-72 max-w-full" />
            <div className="section grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-24" key={index} />
                ))}
            </div>
            <div className="section grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }, (_, index) => (
                    <Skeleton className="h-40" key={index} />
                ))}
            </div>
            <span className="sr-only" role="status">
                Loading drivers
            </span>
        </div>
    );
}
