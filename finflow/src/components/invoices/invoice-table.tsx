import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor, getDaysOverdue } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

interface Props {
  page: number;
  status?: string;
  search?: string;
}

async function fetchInvoices(page: number, status?: string, search?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = cookies();
  const params = new URLSearchParams({ page: String(page), pageSize: "15" });
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  const res = await fetch(`${baseUrl}/api/invoices?${params}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!res.ok) return { data: [], total: 0, totalPages: 0 };
  return res.json();
}

export async function InvoiceTable({ page, status, search }: Props) {
  const { data: invoices, total, totalPages } = await fetchInvoices(page, status, search);

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-400 text-sm">No invoices found.</p>
        <Link href="/invoices/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Create your first invoice →
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{total} invoice{total !== 1 ? "s" : ""}</span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-1">Invoice <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Issue Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv: any) => {
                const daysOverdue = inv.status === "overdue" ? getDaysOverdue(inv.due_date) : 0;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{inv.client_name}</p>
                        {inv.client_email && (
                          <p className="text-xs text-gray-400">{inv.client_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={inv.status === "overdue" ? "text-red-600 font-medium" : "text-gray-500"}>
                          {formatDate(inv.due_date)}
                        </p>
                        {daysOverdue > 0 && (
                          <p className="text-xs text-red-500">{daysOverdue}d overdue</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(Number(inv.total_amount))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={Number(inv.amount_due) > 0 ? "font-medium text-gray-900" : "text-gray-400"}>
                        {formatCurrency(Number(inv.amount_due))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
