"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {value >= 0 ? (
          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className={`font-medium ${value >= 0 ? "text-green-600" : "text-red-600"}`}>
          {formatCurrency(Math.abs(value))}
        </span>
      </div>
    </div>
  );
}

export function CashFlowForecast() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const cashFlow = d.cashFlow ?? [];
        // Extend with 3-month simple moving average forecast
        const withForecast = [...cashFlow];
        if (cashFlow.length >= 3) {
          const last3 = cashFlow.slice(-3);
          const avgNet = last3.reduce((s: number, m: any) => s + Number(m.net), 0) / 3;
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const lastMonth = cashFlow[cashFlow.length - 1]?.month ?? "";
          const lastMonthIndex = months.findIndex((m) => lastMonth.startsWith(m));

          for (let i = 1; i <= 3; i++) {
            const idx = (lastMonthIndex + i) % 12;
            const yr = lastMonth.slice(-2);
            withForecast.push({
              month: `${months[idx]} ${yr}`,
              net: avgNet,
              forecast: true,
            });
          }
        }
        setData(withForecast);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Net Cash Flow + Forecast</CardTitle>
        <CardDescription>
          Historical net position with 3-month moving average projection
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={2} />
              <Bar
                dataKey="net"
                radius={[4, 4, 0, 0]}
                fill="#3b82f6"
                // Forecasted bars rendered lighter
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-500" />
            <span>Actual net</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-200" />
            <span>Forecast (3-month avg)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
