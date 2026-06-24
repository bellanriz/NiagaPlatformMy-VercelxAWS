"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm space-y-1">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500 capitalize">{p.name}</span>
          </div>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CashFlowOverview() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d.cashFlow ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Compute totals from last 6 months
  const totalInflow = data.reduce((s, d) => s + Number(d.inflow), 0);
  const totalOutflow = data.reduce((s, d) => s + Number(d.outflow), 0);
  const netCashFlow = totalInflow - totalOutflow;

  const summaryCards = [
    {
      label: "Total Inflow",
      value: formatCurrency(totalInflow, "USD", true),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Outflow",
      value: formatCurrency(totalOutflow, "USD", true),
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Net Cash Flow",
      value: formatCurrency(Math.abs(netCashFlow), "USD", true),
      prefix: netCashFlow >= 0 ? "+" : "-",
      icon: netCashFlow >= 0 ? TrendingUp : Minus,
      color: netCashFlow >= 0 ? "text-green-600" : "text-red-600",
      bg: netCashFlow >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>
                  {c.prefix ?? ""}{c.value}
                </p>
                <p className="text-xs text-gray-400">Last 6 months</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Cash Flow — 6 Month Trend</CardTitle>
          <CardDescription>Monthly inflow vs outflow with net position</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">
              Loading chart...
            </div>
          ) : data.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  formatter={(v) => <span className="capitalize text-gray-600">{v}</span>}
                />
                <Area type="monotone" dataKey="inflow" stroke="#3b82f6" strokeWidth={2} fill="url(#inflowGrad2)" name="inflow" />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" strokeWidth={2} fill="url(#outflowGrad2)" name="outflow" />
                <Area type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} fill="url(#netGrad)" name="net" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
