import { Skeleton } from "@/components/ui/skeleton";

/**
 * Four cards are enough to fill the first viewport, so the footer stays below
 * the fold exactly as it does once the real (up to 20-post) page paints.
 */
const PLACEHOLDER_COUNT = 4;

/**
 * Skeleton for the public post list.
 *
 * Mirrors `PostCard` one-for-one — same wrapper padding, meta line, two-line
 * title, two-line excerpt and tag row — so the placeholder occupies the same
 * height as the painted card and nothing shifts when the data arrives.
 * Line boxes reuse the real text leading (`leading-snug`, `leading-relaxed`)
 * so the rhythm stays correct at every breakpoint.
 */
export function PostListSkeleton() {
  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
        <div key={i} className="py-8 first:pt-0 last:pb-0">
          {/* date · reading time — text-xs (1rem line box) */}
          <div className="mb-3 flex h-4 items-center gap-3">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="size-1 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* title — sm:text-2xl, leading-snug (1.375 → 33px line box) */}
          <div className="font-serif text-lg font-semibold leading-snug tracking-tight sm:text-2xl">
            <div className="flex h-[1.375em] items-center">
              <Skeleton className="h-[0.72em] w-full" />
            </div>
            <div className="flex h-[1.375em] items-center">
              <Skeleton className="h-[0.72em] w-3/5" />
            </div>
          </div>

          {/* excerpt — text-[15px], leading-relaxed (1.625 line box) */}
          <div className="mt-3 text-[15px] leading-relaxed">
            <div className="flex h-[1.625em] items-center">
              <Skeleton className="h-[0.85em] w-full" />
            </div>
            <div className="flex h-[1.625em] items-center">
              <Skeleton className="h-[0.85em] w-11/12" />
            </div>
          </div>

          {/* tags — Badge is h-5, rounded-full */}
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
