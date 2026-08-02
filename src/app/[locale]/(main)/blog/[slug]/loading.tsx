import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="mb-4 h-10 w-4/5" />
      <Skeleton className="mb-6 h-5 w-2/3" />
      <div className="flex gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-8 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </article>
  );
}
