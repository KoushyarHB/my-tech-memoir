"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardCommentsTrendPointDto } from "../types";

type AdminCommentsTrendChartProps = {
  data: DashboardCommentsTrendPointDto[];
};

export function AdminCommentsTrendChart({ data }: AdminCommentsTrendChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--ink-secondary)" }}
          />
          <Line
            type="monotone"
            dataKey="approved"
            name="Approved"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="pending"
            name="Pending"
            stroke="#eab308"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="rejected"
            name="Spam / Rejected"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
