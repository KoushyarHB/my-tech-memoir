import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardRange } from "../constants/dashboard";
import { fetchDashboardTrends } from "../services/dashboard-service";
import type { GetDashboardTrendsDto } from "../types";

/**
 * Admin domain: dashboard chart data for one range.
 *
 * Each range is its own cache entry, so flipping back to a range you already
 * viewed is instant.
 */
export function useDashboardTrends(
  range: DashboardRange,
  initialData?: GetDashboardTrendsDto
) {
  return useQuery({
    queryKey: queryKeys.dashboard.trends(range),
    queryFn: () => fetchDashboardTrends(range),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
