import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ClientsGrid } from "@/components/clients/clients-grid";
import { ClientFilters } from "@/components/clients/client-filters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Clients" };

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    risk?: string;
  };
}

export default function ClientsPage({ searchParams }: PageProps) {
  return (
    <div className="flex flex-col h-full">
      <Header title="Clients" subtitle="Manage your client relationships" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <ClientFilters
            currentSearch={searchParams.search}
            currentRisk={searchParams.risk}
          />
          <Button asChild className="shrink-0">
            <Link href="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Link>
          </Button>
        </div>

        <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
          <ClientsGrid
            page={Number(searchParams.page ?? 1)}
            search={searchParams.search}
            risk={searchParams.risk}
          />
        </Suspense>
      </div>
    </div>
  );
}
