import { cookies } from "next/headers";
import { CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

async function getSummary() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = cookies();
  const res = await fetch(`${baseUrl}/api/expenses?pageSize=1`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { total_pending: 0, total_paid: 0, total_all: 0 };
  const json = await res.json();
  return json.summary ?? { total_pending: 0, total_paid: 0, total_all: 0 };
}

export async function ExpenseSummaryCards() {
  const summary = await getSummary();

  const cards = [
    {
      title: "Total AP",
      value: formatCurrency(summary.total_all, "USD", true),
      subtitle: "All expenses",
      icon: CreditCard,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Pending",
      value: formatCurrency(summary.total_pending, "USD", true),
      subtitle: "Awaiting payment",
      icon: Clock,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      title: "Paid",
      value: formatCurrency(summary.total_paid, "USD", true),
      subtitle: "Settled expenses",
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${card.iconBg}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{card.title}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400">{card.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
