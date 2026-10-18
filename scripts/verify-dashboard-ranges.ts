import assert from "node:assert/strict";
import {
  buildDashboardBuckets,
  bucketIndexFor,
  dashboardRangeStart,
  describeBucket,
} from "../src/features/admin/server/dashboard-buckets";
import {
  DASHBOARD_RANGES,
  DASHBOARD_RANGE_CONFIG,
} from "../src/features/admin/constants/dashboard";
import { normalizeDashboardRange } from "../src/features/admin/server/dashboard-service";

const now = new Date("2026-10-18T15:30:00.000Z");

for (const range of DASHBOARD_RANGES) {
  const config = DASHBOARD_RANGE_CONFIG[range];
  const buckets = buildDashboardBuckets(range, now);

  assert.equal(buckets.length, config.count, `${range} bucket count`);

  // Contiguous: each bucket ends exactly where the next begins.
  for (let i = 1; i < buckets.length; i++) {
    assert.equal(
      buckets[i].start.getTime(),
      buckets[i - 1].end.getTime(),
      `${range} contiguous at ${i}`
    );
  }

  // The final bucket contains "now" (window ends on the current period).
  const last = buckets[buckets.length - 1];
  assert.ok(
    now >= last.start && now < last.end,
    `${range} last bucket must contain now (${last.start.toISOString()}..${last.end.toISOString()})`
  );

  // Keys are unique.
  assert.equal(new Set(buckets.map((b) => b.key)).size, buckets.length);

  // Every bucket start resolves back to its own index.
  buckets.forEach((bucket, index) => {
    assert.equal(
      bucketIndexFor(buckets, bucket.start),
      index,
      `${range} index of bucket ${index}`
    );
  });

  console.log(
    `${range.padEnd(4)} ${config.bucket.padEnd(5)} ${String(buckets.length).padStart(2)} buckets  ` +
      `${buckets[0].label} → ${buckets[buckets.length - 1].label}  ` +
      `(${buckets[0].start.toISOString().slice(0, 10)} … ${last.end.toISOString().slice(0, 10)})`
  );
}

// Daily range: exactly 7 days back, inclusive of today.
const week = buildDashboardBuckets("7d", now);
assert.equal(week[0].start.toISOString(), "2026-10-12T00:00:00.000Z");
assert.equal(week[6].start.toISOString(), "2026-10-18T00:00:00.000Z");

// 30d spans 30 distinct days.
const month = buildDashboardBuckets("30d", now);
assert.equal(month.length, 30);
assert.equal(month[0].start.toISOString(), "2026-09-19T00:00:00.000Z");

// Weekly buckets start on Monday.
const quarter = buildDashboardBuckets("90d", now);
for (const bucket of quarter) {
  assert.equal(bucket.start.getUTCDay(), 1, "weekly bucket starts Monday");
}
assert.equal(quarter.length, 13);

// Monthly buckets are the 1st of each month, ending with the current month.
const year = buildDashboardBuckets("12m", now);
assert.equal(year.length, 12);
assert.equal(year[0].start.toISOString(), "2025-11-01T00:00:00.000Z");
assert.equal(year[11].start.toISOString(), "2026-10-01T00:00:00.000Z");
assert.equal(year[11].label, "Oct");

// Yearly buckets are Jan 1, ending with the current year.
const lustrum = buildDashboardBuckets("5y", now);
assert.equal(lustrum.length, 5);
assert.equal(lustrum[0].start.toISOString(), "2022-01-01T00:00:00.000Z");
assert.equal(lustrum[4].start.toISOString(), "2026-01-01T00:00:00.000Z");
assert.equal(lustrum[0].label, "2022");
assert.equal(lustrum[4].label, "2026");
for (const bucket of lustrum) {
  assert.equal(bucket.start.getUTCMonth(), 0, "yearly bucket starts January");
  assert.equal(bucket.start.getUTCDate(), 1, "yearly bucket starts on the 1st");
}

// Out-of-window timestamps are rejected rather than clamped.
assert.equal(
  bucketIndexFor(week, new Date("2026-10-01T00:00:00.000Z")),
  -1
);
assert.equal(
  bucketIndexFor(week, new Date("2026-10-19T00:00:00.000Z")),
  -1
);

// Range start is the earliest bucket.
assert.equal(
  dashboardRangeStart(week).toISOString(),
  week[0].start.toISOString()
);

// Tooltip labels describe the bucket.
assert.equal(
  describeBucket("7d", 6, week),
  "Oct 18, 2026"
);
assert.equal(
  describeBucket("90d", 0, quarter),
  "Week of Jul 20, 2026"
);
assert.equal(describeBucket("12m", 11, year), "October 2026");
assert.equal(describeBucket("5y", 0, lustrum), "2022");
assert.equal(describeBucket("5y", 4, lustrum), "2026");

// Unknown range falls back to the default instead of throwing.
assert.equal(normalizeDashboardRange("bogus"), "14d");
assert.equal(normalizeDashboardRange(null), "14d");
assert.equal(normalizeDashboardRange("30d"), "30d");

console.log("\ndashboard range verification passed");
