"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#6b7280"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-800">{payload[0].name}</p>
      <p className="text-gray-600 mt-1">{formatCurrency(payload[0].value)}</p>
      <p className="text-gray-400 text-xs">{payload[0].payload.count} expenses</p>
    </div>
  );
}

export function CashFlowBreakdown() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expenses/categories")
      .then((r) => r.json())
      .then((d) => { setData(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const total = data.reduce((s, d) => s + Number(d.total_amount), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>Spending by category</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400">No expense data</div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total_amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {data.map((item: any, i: number) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-700">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(item.total_amount) / total) * 100)}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-20 text-right">
                      {formatCurrency(Number(item.total_amount), "USD", true)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
