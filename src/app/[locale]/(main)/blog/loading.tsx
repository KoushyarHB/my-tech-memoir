import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <Skeleton className="mb-10 h-9 w-48" />
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-8">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="mb-3 h-7 w-3/4" />
            <Skeleton className="mb-4 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
