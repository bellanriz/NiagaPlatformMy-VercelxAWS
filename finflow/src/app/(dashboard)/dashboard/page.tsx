import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { DashboardMetricsCards } from "@/components/dashboard/metrics-cards";
import { CashFlowChart } from "@/components/dashboard/cashflow-chart";
import { AgingChart } from "@/components/dashboard/aging-chart";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <div className="flex flex-col h-full">
      <Header
        title={`Good morning, ${user?.name?.split(" ")[0] ?? "there"} 👋`}
        subtitle="Here's what's happening with your finances today"
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Metric cards */}
        <Suspense fallback={<MetricsSkeleton />}>
          <DashboardMetricsCards />
        </Suspense>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<ChartSkeleton />}>
              <CashFlowChart />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<ChartSkeleton />}>
              <AgingChart />
            </Suspense>
          </div>
        </div>

        {/* Recent invoices */}
        <Suspense fallback={<TableSkeleton />}>
          <RecentInvoices />
        </Suspense>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-72 rounded-lg" />;
}

function TableSkeleton() {
  return <Skeleton className="h-64 rounded-lg" />;
}
