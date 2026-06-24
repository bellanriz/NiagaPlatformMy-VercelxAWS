"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Send, Clock, AlertTriangle,
  Download, MoreHorizontal, Trash2, DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, getStatusColor, getRiskColor, getRiskLabel } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  invoice: any;
}

export function InvoiceDetail({ invoice }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(String(invoice.amount_due));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Status updated", variant: "success" as any });
      router.refresh();
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function recordPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: Number(paymentAmount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast({ title: "Payment recorded successfully", variant: "success" as any });
      setPaymentOpen(false);
      router.refresh();
    } catch (e: any) {
      toast({ title: e.message ?? "Failed to record payment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const canMarkSent = invoice.status === "draft";
  const canRecordPayment = ["sent", "viewed", "partial", "overdue"].includes(invoice.status);
  const isPaid = invoice.status === "paid";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main invoice */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Invoice</p>
                <CardTitle className="text-2xl">{invoice.invoice_number}</CardTitle>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client & dates */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
                <p className="font-semibold text-gray-900">{invoice.client_name}</p>
                {invoice.client_email && <p className="text-sm text-gray-500">{invoice.client_email}</p>}
                {invoice.company && <p className="text-sm text-gray-500">{invoice.company}</p>}
                {invoice.address && <p className="text-sm text-gray-500">{invoice.address}</p>}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Issue Date</span>
                  <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Due Date</span>
                  <span className={`font-medium ${invoice.status === "overdue" ? "text-red-600" : ""}`}>
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
                {invoice.paid_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paid Date</span>
                    <span className="font-medium text-green-600">{formatDate(invoice.paid_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Line items */}
            {invoice.items?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Line Items</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-left text-xs text-gray-400 uppercase">
                        <th className="px-4 py-2 font-medium">Description</th>
                        <th className="px-4 py-2 font-medium text-right">Qty</th>
                        <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                        <th className="px-4 py-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {invoice.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-gray-700">{item.description}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(Number(item.unit_price))}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                {Number(invoice.tax_rate) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax ({invoice.tax_rate}%)</span>
                    <span>{formatCurrency(Number(invoice.tax_amount))}</span>
                  </div>
                )}
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(invoice.discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(Number(invoice.total_amount))}</span>
                </div>
                {Number(invoice.amount_paid) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(Number(invoice.amount_paid))}</span>
                  </div>
                )}
                {Number(invoice.amount_due) > 0 && (
                  <div className="flex justify-between font-bold text-lg text-blue-700 border-t pt-2">
                    <span>Balance Due</span>
                    <span>{formatCurrency(Number(invoice.amount_due))}</span>
                  </div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar actions */}
      <div className="space-y-4">
        {/* Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canMarkSent && (
              <Button
                className="w-full gap-2"
                onClick={() => updateStatus("sent")}
                disabled={loading}
              >
                <Send className="h-4 w-4" /> Mark as Sent
              </Button>
            )}
            {canRecordPayment && (
              <Button
                className="w-full gap-2"
                onClick={() => setPaymentOpen(true)}
                disabled={loading}
              >
                <DollarSign className="h-4 w-4" /> Record Payment
              </Button>
            )}
            {isPaid && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Paid in full
              </div>
            )}
            <Button variant="outline" className="w-full gap-2" disabled>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>

        {/* Client info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-gray-900">{invoice.client_name}</p>
            {invoice.client_email && <p className="text-gray-500">{invoice.client_email}</p>}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-gray-400">Risk:</span>
              <span className={`font-medium ${getRiskColor(invoice.risk_score ?? 50)}`}>
                {getRiskLabel(invoice.risk_score ?? 50)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Payment Terms:</span>
              <span className="font-medium">Net {invoice.payment_terms ?? 30}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Balance due: {formatCurrency(Number(invoice.amount_due))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={invoice.amount_due}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="check">Check</option>
                <option value="wire">Wire</option>
                <option value="ach">ACH</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={recordPayment} disabled={loading || !paymentAmount}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
