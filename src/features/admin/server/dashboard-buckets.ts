import {
  DASHBOARD_RANGE_CONFIG,
  type DashboardBucket,
  type DashboardRange,
} from "../constants/dashboard";

/**
 * Admin domain: time bucketing for the dashboard charts.
 *
 * Buckets are generated from the range config rather than from the data, so
 * every chart shows a continuous axis with explicit zeroes. All boundaries are
 * UTC so the server and client agree on which bucket a row belongs to.
 */

export type DashboardBucketRange = {
  /** Stable identifier, used as the React key. */
  key: string;
  /** Short axis label. */
  label: string;
  /** Inclusive start. */
  start: Date;
  /** Exclusive end. */
  end: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

/** Monday-based week start, in UTC. */
function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const weekday = (day.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(day.getTime() - weekday * MS_PER_DAY);
}

/** Start of the bucket containing `date`. */
function bucketStart(date: Date, bucket: DashboardBucket): Date {
  if (bucket === "year") return startOfUtcYear(date);
  if (bucket === "month") return startOfUtcMonth(date);
  if (bucket === "week") return startOfUtcWeek(date);
  return startOfUtcDay(date);
}

/** Moves `date` by `periods` buckets (negative = backwards). */
function shiftBuckets(
  date: Date,
  bucket: DashboardBucket,
  periods: number
): Date {
  if (bucket === "year") {
    return new Date(Date.UTC(date.getUTCFullYear() + periods, 0, 1));
  }
  if (bucket === "month") {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + periods, 1)
    );
  }
  const days = bucket === "week" ? 7 : 1;
  return new Date(date.getTime() + periods * days * MS_PER_DAY);
}

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const yearFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  timeZone: "UTC",
});

/** Long form used by tooltips, e.g. "Oct 6, 2026" or "October 2026". */
const fullDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const fullMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const fullYearFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Builds `count` buckets ending with the one that contains `now`.
 * The last bucket's `end` is the start of the next bucket, so it is exclusive.
 */
export function buildDashboardBuckets(
  range: DashboardRange,
  now: Date = new Date()
): DashboardBucketRange[] {
  const { bucket, count } = DASHBOARD_RANGE_CONFIG[range];

  const current = bucketStart(now, bucket);
  const first = shiftBuckets(current, bucket, -(count - 1));

  return Array.from({ length: count }, (_, index) => {
    const start = shiftBuckets(first, bucket, index);
    const end = shiftBuckets(first, bucket, index + 1);

    return {
      key: `${bucket}-${start.toISOString().slice(0, 10)}`,
      label:
        bucket === "year"
          ? yearFormatter.format(start)
          : bucket === "month"
            ? monthFormatter.format(start)
            : dayFormatter.format(start),
      start,
      end,
    };
  });
}

/** Human-readable description of a bucket, for tooltips. */
export function describeBucket(
  range: DashboardRange,
  index: number,
  buckets: DashboardBucketRange[]
): string {
  const bucket = DASHBOARD_RANGE_CONFIG[range].bucket;
  const entry = buckets[index];
  if (!entry) return "";

  return bucket === "year"
    ? fullYearFormatter.format(entry.start)
    : bucket === "month"
      ? fullMonthFormatter.format(entry.start)
      : bucket === "week"
        ? `Week of ${fullDayFormatter.format(entry.start)}`
        : fullDayFormatter.format(entry.start);
}

/** The earliest bucket start — the lower bound for trend queries. */
export function dashboardRangeStart(buckets: DashboardBucketRange[]): Date {
  return buckets[0]?.start ?? startOfUtcDay(new Date());
}

/** Index of the bucket containing `date`, or -1 when out of range. */
export function bucketIndexFor(
  buckets: DashboardBucketRange[],
  date: Date
): number {
  const time = date.getTime();
  for (let index = 0; index < buckets.length; index++) {
    const bucket = buckets[index];
    if (time >= bucket.start.getTime() && time < bucket.end.getTime()) {
      return index;
    }
  }
  return -1;
}
