"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardPostGrowthPointDto } from "../types";

type AdminPostGrowthChartProps = {
  data: DashboardPostGrowthPointDto[];
};

export function AdminPostGrowthChart({ data }: AdminPostGrowthChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "var(--bg-muted)" }}
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--ink-primary)",
              fontSize: 12,
            }}
            labelFormatter={(_label, payload) =>
              payload?.[0]?.payload?.bucket ?? String(_label)
            }
          />
          <Bar
            dataKey="count"
            name="Posts"
            fill="var(--ink-primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
