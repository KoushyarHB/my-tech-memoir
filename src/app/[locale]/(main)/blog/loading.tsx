import { Skeleton } from "@/components/ui/skeleton";
import { PostListSkeleton } from "@/features/blog/components";

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-5 sm:py-16">
      <PostListSkeleton />
      {/* post count — text-xs, centered, mt-6 */}
      <div className="mt-6 flex h-4 items-center justify-center">
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
