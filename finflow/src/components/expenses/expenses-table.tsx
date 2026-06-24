import Link from "next/link";
import { cookies } from "next/headers";
import { Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

interface Props {
  page: number;
  status?: string;
  search?: string;
  category?: string;
}

async function fetchExpenses(page: number, status?: string, search?: string, category?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = cookies();
  const params = new URLSearchParams({ page: String(page), pageSize: "15" });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const res = await fetch(`${baseUrl}/api/expenses?${params}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [], total: 0, totalPages: 0 };
  return res.json();
}

const CATEGORY_COLORS: Record<string, string> = {
  Software: "bg-blue-100 text-blue-700",
  Payroll: "bg-purple-100 text-purple-700",
  Rent: "bg-orange-100 text-orange-700",
  Marketing: "bg-pink-100 text-pink-700",
  Utilities: "bg-yellow-100 text-yellow-700",
  Travel: "bg-teal-100 text-teal-700",
};

export async function ExpensesTable({ page, status, search, category }: Props) {
  const { data: expenses, total, totalPages } = await fetchExpenses(page, status, search, category);

  if (expenses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-400 text-sm">No expenses found.</p>
        <Link href="/expenses/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Add your first expense →
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{total} expense{total !== 1 ? "s" : ""}</p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{exp.vendor_name}</p>
                    {exp.description && (
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{exp.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {exp.category ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[exp.category] ?? "bg-gray-100 text-gray-600"}`}>
                        <Tag className="h-3 w-3" />
                        {exp.category}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(exp.expense_date)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {exp.due_date ? formatDate(exp.due_date) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(Number(exp.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(exp.status)}`}>
                      {exp.status}
                    </span>
                  </td>
                </tr>
              ))}
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
