import { cn } from "@/lib/utils";

export type AdminMetric = {
  label: string;
  value: number;
};

type AdminMetricsProps = {
  metrics: AdminMetric[];
  /** Grid template classes, e.g. `sm:grid-cols-4`. */
  className?: string;
};

/**
 * Summary tiles for admin pages.
 *
 * Rendered on the client from query data so mutations can update the numbers
 * through cache invalidation instead of forcing a full `router.refresh()`.
 */
export function AdminMetrics({ metrics, className }: AdminMetricsProps) {
  return (
    <dl
      className={cn(
        "mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border",
        className
      )}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-(--bg-elevated) px-4 py-4 sm:px-5">
          <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-tertiary">
            {metric.label}
          </dt>
          <dd className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink-primary">
            {metric.value.toLocaleString()}
          </dd>
        </div>
      ))}
    </dl>
  );
}
