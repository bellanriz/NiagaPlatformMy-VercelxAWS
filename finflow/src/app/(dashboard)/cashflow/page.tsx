import { Header } from "@/components/layout/header";
import { CashFlowOverview } from "@/components/cashflow/cashflow-overview";
import { CashFlowBreakdown } from "@/components/cashflow/cashflow-breakdown";
import { CashFlowForecast } from "@/components/cashflow/cashflow-forecast";

export const metadata = { title: "Cash Flow" };

export default function CashFlowPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Cash Flow"
        subtitle="Monitor inflows, outflows, and forecast your financial position"
      />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <CashFlowOverview />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashFlowBreakdown />
          <CashFlowForecast />
        </div>
      </div>
    </div>
  );
}
