import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

async function getDashboardData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export async function DashboardMetricsCards() {
  const data = await getDashboardData();
  const { metrics } = data;

  const cards = [
    {
      title: "Total AR",
      value: formatCurrency(metrics.totalAR, "USD", true),
      subtext: `${metrics.invoiceCount} active invoices`,
      icon: DollarSign,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: metrics.arChange,
      trendLabel: "vs last month",
    },
    {
      title: "Overdue",
      value: formatCurrency(metrics.overdueAR, "USD", true),
      subtext: `${metrics.overdueCount} invoices overdue`,
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      trend: null,
      trendLabel: "",
      danger: metrics.overdueCount > 0,
    },
    {
      title: "Collected This Month",
      value: formatCurrency(metrics.paidThisMonth, "USD", true),
      subtext: "Payments received",
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: null,
      trendLabel: "",
    },
    {
      title: "Avg Days to Pay",
      value: `${metrics.avgDaysToPayment} days`,
      subtext: "Average payment cycle",
      icon: Clock,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: null,
      trendLabel: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.danger ? "border-red-200" : ""}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-400">{card.subtext}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
            {card.trend !== null && (
              <div className="mt-3 flex items-center gap-1">
                {card.trend >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${card.trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(card.trend)}%
                </span>
                <span className="text-xs text-gray-400">{card.trendLabel}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
