import Link from "next/link";
import {
  Mail, Phone, MapPin, Building2,
  FileText, TrendingUp, Clock, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency, formatDate, getStatusColor,
  getRiskColor, getRiskLabel,
} from "@/lib/utils";

interface Props {
  client: any;
}

export function ClientDetail({ client }: Props) {
  const stats = client.stats ?? {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: profile */}
      <div className="space-y-4">
        {/* Profile card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-2xl mb-3">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
              {client.company && <p className="text-sm text-gray-400">{client.company}</p>}
            </div>

            <div className="space-y-3 text-sm">
              {client.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>{client.address}</span>
                </div>
              )}
              {client.country && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{client.country}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Payment Terms</p>
                <p className="font-medium">Net {client.payment_terms ?? 30}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Currency</p>
                <p className="font-medium">{client.currency}</p>
              </div>
              {client.credit_limit && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Credit Limit</p>
                  <p className="font-medium">{formatCurrency(Number(client.credit_limit))}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${getRiskColor(client.risk_score)}`}>
                {getRiskLabel(client.risk_score)}
              </span>
              <span className="text-3xl font-bold text-gray-200">{client.risk_score}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${
                  client.risk_score < 30
                    ? "bg-green-500"
                    : client.risk_score < 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${client.risk_score}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{client.risk_score}/100</p>
          </CardContent>
        </Card>

        <Button asChild className="w-full gap-2">
          <Link href={`/invoices/new?clientId=${client.id}`}>
            <FileText className="h-4 w-4" /> New Invoice
          </Link>
        </Button>
      </div>

      {/* Right: stats + invoices */}
      <div className="lg:col-span-2 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Invoiced", value: formatCurrency(stats.total_invoiced ?? 0, "USD", true), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Paid", value: formatCurrency(stats.total_paid ?? 0, "USD", true), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: "Outstanding", value: formatCurrency(stats.total_outstanding ?? 0, "USD", true), icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Avg Days to Pay", value: `${stats.avg_days_to_pay ?? 0}d`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} mb-2`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent invoices */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Link
              href={`/invoices?clientId=${client.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {!client.recentInvoices?.length ? (
              <p className="text-sm text-gray-400 text-center py-6">No invoices yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase border-b">
                      <th className="pb-2 pr-4 font-medium">Invoice</th>
                      <th className="pb-2 pr-4 font-medium">Due</th>
                      <th className="pb-2 pr-4 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {client.recentInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4">
                          <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-gray-500">{formatDate(inv.due_date)}</td>
                        <td className="py-2.5 pr-4 text-right font-medium">
                          {formatCurrency(Number(inv.total_amount))}
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
