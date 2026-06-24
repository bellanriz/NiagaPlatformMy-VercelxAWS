import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { InvoiceFilters } from "@/components/invoices/invoice-filters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Invoices" };

interface PageProps {
  searchParams: {
    page?: string;
    status?: string;
    search?: string;
  };
}

export default function InvoicesPage({ searchParams }: PageProps) {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Invoices"
        subtitle="Manage and track all your invoices"
      />
      <div className="flex-1 p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <InvoiceFilters
            currentStatus={searchParams.status}
            currentSearch={searchParams.search}
          />
          <Button asChild className="shrink-0">
            <Link href="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>

        {/* Table */}
        <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
          <InvoiceTable
            page={Number(searchParams.page ?? 1)}
            status={searchParams.status}
            search={searchParams.search}
          />
        </Suspense>
      </div>
    </div>
  );
}
