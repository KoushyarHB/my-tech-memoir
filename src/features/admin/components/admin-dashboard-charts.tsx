"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_RANGES,
  DASHBOARD_RANGE_CONFIG,
  DEFAULT_DASHBOARD_RANGE,
  type DashboardRange,
} from "../constants/dashboard";
import { useDashboardTrends } from "../hooks/use-dashboard-trends";
import type { GetDashboardTrendsDto } from "../types";
import { AdminCommentsTrendChart } from "./admin-comments-trend-chart";
import { AdminPostGrowthChart } from "./admin-post-growth-chart";

type AdminDashboardChartsProps = {
  initialData: GetDashboardTrendsDto;
};

/**
 * Admin dashboard: both activity charts behind one shared range selector.
 *
 * The initial render uses the server-provided data for the default range, so
 * switching ranges is the only thing that ever hits the network.
 */
export function AdminDashboardCharts({ initialData }: AdminDashboardChartsProps) {
  const [range, setRange] = useState<DashboardRange>(
    initialData.range ?? DEFAULT_DASHBOARD_RANGE
  );

  const { data, isFetching, isPlaceholderData } = useDashboardTrends(
    range,
    range === initialData.range ? initialData : undefined
  );

  const trends = data ?? initialData;
  const busy = isFetching || isPlaceholderData;

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink-primary">Activity</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-tertiary">
            Posts published and comment moderation over the selected window
            {busy ? (
              <Loader2 className="size-3 animate-spin" aria-label="Loading" />
            ) : null}
          </p>
        </div>

        <div
          role="group"
          aria-label="Time period"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-(--bg-elevated) p-0.5"
        >
          {DASHBOARD_RANGES.map((option) => {
            const active = option === range;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                aria-pressed={active}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors",
                  "outline-none focus-visible:ring-1 focus-visible:ring-(--border-focus)",
                  active
                    ? "bg-(--bg-muted) text-ink-primary"
                    : "text-ink-tertiary hover:text-ink-secondary"
                )}
                title={DASHBOARD_RANGE_CONFIG[option].description}
                aria-label={DASHBOARD_RANGE_CONFIG[option].description}
              >
                {DASHBOARD_RANGE_CONFIG[option].label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4 transition-opacity lg:grid-cols-2",
          busy && "opacity-70"
        )}
      >
        <section className="rounded-xl border border-border bg-(--bg-elevated) p-5">
          <h3 className="mb-4 text-sm font-medium text-ink-primary">
            Post growth
          </h3>
          <AdminPostGrowthChart data={trends.postGrowth} />
        </section>
        <section className="rounded-xl border border-border bg-(--bg-elevated) p-5">
          <h3 className="mb-4 text-sm font-medium text-ink-primary">
            Comments trend
          </h3>
          <AdminCommentsTrendChart data={trends.commentsTrend} />
        </section>
      </div>
    </div>
  );
}
