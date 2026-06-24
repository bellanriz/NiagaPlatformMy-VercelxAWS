import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseSummaryCards } from "@/components/expenses/expense-summary-cards";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Expenses" };

interface PageProps {
  searchParams: {
    page?: string;
    status?: string;
    category?: string;
    search?: string;
  };
}

export default function ExpensesPage({ searchParams }: PageProps) {
  return (
    <div className="flex flex-col h-full">
      <Header title="Expenses" subtitle="Track accounts payable and business expenses" />
      <div className="flex-1 p-6 space-y-4">
        {/* Summary cards */}
        <Suspense fallback={<Skeleton className="h-24 rounded-lg" />}>
          <ExpenseSummaryCards />
        </Suspense>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <ExpenseFilters
            currentStatus={searchParams.status}
            currentSearch={searchParams.search}
            currentCategory={searchParams.category}
          />
          <Button asChild className="shrink-0">
            <Link href="/expenses/new">
              <Plus className="h-4 w-4 mr-2" />
              New Expense
            </Link>
          </Button>
        </div>

        {/* Table */}
        <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
          <ExpensesTable
            page={Number(searchParams.page ?? 1)}
            status={searchParams.status}
            search={searchParams.search}
            category={searchParams.category}
          />
        </Suspense>
      </div>
    </div>
  );
}
