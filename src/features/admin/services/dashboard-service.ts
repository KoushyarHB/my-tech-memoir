import { api } from "@/lib/api-client";
import type { DashboardRange } from "../constants/dashboard";
import type { GetDashboardTrendsDto } from "../types";

/** Admin domain: dashboard endpoints. */

export async function fetchDashboardTrends(
  range: DashboardRange
): Promise<GetDashboardTrendsDto> {
  return api.get<GetDashboardTrendsDto>(
    `/api/dashboard/trends?range=${encodeURIComponent(range)}`
  );
}
