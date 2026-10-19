import { Skeleton } from "@/components/ui/skeleton";
import { PostListSkeleton } from "@/features/blog/components";

export default function TagLoading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      {/* h1 — text-3xl, mb-2 (36px line box) */}
      <div className="mb-2 flex h-9 items-center">
        <Skeleton className="h-7 w-56" />
      </div>
      {/* post count — text-base, mb-8 (24px line box) */}
      <div className="mb-8 flex h-6 items-center">
        <Skeleton className="h-4 w-24" />
      </div>
      <PostListSkeleton />
    </div>
  );
}
