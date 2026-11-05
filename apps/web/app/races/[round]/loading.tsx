import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="content" aria-busy="true">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-3 w-28" />
            <Skeleton className="mt-3 h-10 w-2/3" />
            <Skeleton className="mt-3 h-4 w-1/3" />
            <div className="section flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton className="h-14 min-w-[8rem] flex-1 basis-32" key={index} />
                ))}
            </div>
            <div className="section grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-24" key={index} />
                ))}
            </div>
            <Skeleton className="section h-40" />
            <span className="sr-only" role="status">
                Loading race
            </span>
        </div>
    );
}
