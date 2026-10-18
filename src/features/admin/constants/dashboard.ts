/** Admin domain: dashboard window sizes and selectable ranges. */

export const DASHBOARD_RECENT_LIMIT = 6;

/**
 * Selectable trend windows.
 *
 * Each range maps to a bucket size so a longer window never means hundreds of
 * points: days up to a month, weeks for a quarter, months for a year, years
 * beyond that.
 */
export const DASHBOARD_RANGES = [
  "7d",
  "14d",
  "30d",
  "90d",
  "12m",
  "5y",
] as const;

export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export const DEFAULT_DASHBOARD_RANGE: DashboardRange = "14d";

export type DashboardBucket = "day" | "week" | "month" | "year";

export type DashboardRangeConfig = {
  bucket: DashboardBucket;
  /** Number of buckets, including the current one. */
  count: number;
  /** Compact button label. */
  label: string;
  /** Tooltip / accessible description. */
  description: string;
};

export const DASHBOARD_RANGE_CONFIG: Record<
  DashboardRange,
  DashboardRangeConfig
> = {
  "7d": {
    bucket: "day",
    count: 7,
    label: "7D",
    description: "Last 7 days",
  },
  "14d": {
    bucket: "day",
    count: 14,
    label: "14D",
    description: "Last 14 days",
  },
  "30d": {
    bucket: "day",
    count: 30,
    label: "30D",
    description: "Last 30 days",
  },
  "90d": {
    bucket: "week",
    count: 13,
    label: "90D",
    description: "Last 90 days, by week",
  },
  "12m": {
    bucket: "month",
    count: 12,
    label: "12M",
    description: "Last 12 months",
  },
  "5y": {
    bucket: "year",
    count: 5,
    label: "5Y",
    description: "Last 5 years",
  },
};

export function isDashboardRange(value: unknown): value is DashboardRange {
  return (
    typeof value === "string" &&
    (DASHBOARD_RANGES as readonly string[]).includes(value)
  );
}
