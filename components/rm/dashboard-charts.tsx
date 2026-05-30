"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type DataPoint = { label: string; gastos: number; mensalidades: number };

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-zinc-900 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-zinc-600">
          {p.name === "gastos" ? "Gastos" : "Mensalidades"}:{" "}
          <span className="font-semibold text-zinc-900">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export function DashboardCharts({ data }: { data: DataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Mensal (últimos 6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
            <Legend
              formatter={(value) => (value === "gastos" ? "Gastos" : "Mensalidades")}
              wrapperStyle={{ fontSize: 12, color: "#71717a", paddingTop: 16 }}
            />
            <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="mensalidades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
