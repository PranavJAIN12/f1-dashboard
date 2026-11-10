import Image from "next/image";
import { cn } from "@/lib/utils";

// The official icons are dark outlines on transparent, so they sit on a light tile in both themes.
export function CircuitImage({
    src,
    alt,
    className,
    eager = false,
}: {
    src: string | null;
    alt: string;
    className?: string;
    eager?: boolean;
}) {
    if (!src) return null;
    return (
        <span
            className={cn(
                "flex shrink-0 items-center justify-center rounded-md bg-white p-1.5",
                className,
            )}
        >
            <Image
                src={src}
                alt={alt}
                width={160}
                height={120}
                // Loaded by the browser, not Next's optimizer, which would fetch from the server and
                // fail behind proxies whose CA Node does not trust.
                unoptimized
                loading={eager ? "eager" : undefined}
                className="h-full w-full object-contain"
            />
        </span>
    );
}
