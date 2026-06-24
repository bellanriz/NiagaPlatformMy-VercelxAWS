import Link from "next/link";
import { cookies } from "next/headers";
import {
  Building2, Mail, TrendingUp, FileText,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, getRiskColor, getRiskLabel, getStatusColor } from "@/lib/utils";

interface Props {
  page: number;
  search?: string;
  risk?: string;
}

async function fetchClients(page: number, search?: string, risk?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = cookies();
  const params = new URLSearchParams({ page: String(page), pageSize: "12" });
  if (search) params.set("search", search);
  if (risk) params.set("risk", risk);

  const res = await fetch(`${baseUrl}/api/clients?${params}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [], total: 0, totalPages: 0 };
  return res.json();
}

export async function ClientsGrid({ page, search, risk }: Props) {
  const { data: clients, total, totalPages } = await fetchClients(page, search, risk);

  if (clients.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No clients found.</p>
        <Link href="/clients/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Add your first client →
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{total} client{total !== 1 ? "s" : ""}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((client: any) => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-full">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                      {client.company && (
                        <p className="text-xs text-gray-400 truncate">{client.company}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
                </div>

                {/* Email */}
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-gray-50 p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">Outstanding</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(Number(client.total_outstanding ?? 0), "USD", true)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">Total Invoiced</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(Number(client.total_invoiced ?? 0), "USD", true)}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className={`h-3.5 w-3.5 ${getRiskColor(client.risk_score)}`} />
                    <span className={`font-medium ${getRiskColor(client.risk_score)}`}>
                      {getRiskLabel(client.risk_score)} Risk
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{client.invoice_count ?? 0} invoices</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
