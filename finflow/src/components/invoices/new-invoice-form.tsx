"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, generateInvoiceNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  client_id: z.string().uuid("Select a client"),
  invoice_number: z.string().min(1),
  issue_date: z.string(),
  due_date: z.string(),
  tax_rate: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description required"),
    quantity: z.number().min(0.001, "Min 0.001"),
    unit_price: z.number().min(0, "Min 0"),
  })).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  clients: Array<{ id: string; name: string; company?: string }>;
}

export function NewInvoiceForm({ clients }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const {
    register, handleSubmit, watch, setValue, control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoice_number: generateInvoiceNumber("INV"),
      issue_date: today,
      due_date: due30,
      tax_rate: 0,
      discount_amount: 0,
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = watch("items");
  const watchTax = watch("tax_rate") ?? 0;
  const watchDiscount = watch("discount_amount") ?? 0;

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const taxAmount = (subtotal * watchTax) / 100;
  const total = subtotal + taxAmount - watchDiscount;

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          subtotal,
          status: "draft",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create invoice");
      }
      const json = await res.json();
      toast({ title: "Invoice created", variant: "success" as any });
      router.push(`/invoices/${json.data.id}`);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Client *</Label>
                  <Select onValueChange={(v) => setValue("client_id", v)}>
                    <SelectTrigger className={errors.client_id ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.company ? ` — ${c.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && <p className="text-xs text-red-500">{errors.client_id.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Invoice Number *</Label>
                  <Input {...register("invoice_number")} />
                  {errors.invoice_number && <p className="text-xs text-red-500">{errors.invoice_number.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Issue Date *</Label>
                  <Input type="date" {...register("issue_date")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date *</Label>
                  <Input type="date" {...register("due_date")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-6 space-y-1">
                    {i === 0 && <Label className="text-xs">Description</Label>}
                    <Input
                      placeholder="Item description"
                      {...register(`items.${i}.description`)}
                      className={errors.items?.[i]?.description ? "border-red-400" : ""}
                    />
                    {errors.items?.[i]?.description && (
                      <p className="text-xs text-red-500">{errors.items[i]?.description?.message}</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1">
                    {i === 0 && <Label className="text-xs">Qty</Label>}
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="1"
                      {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    {i === 0 && <Label className="text-xs">Unit Price</Label>}
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register(`items.${i}.unit_price`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-span-1 flex items-end pb-0.5">
                    {i === 0 && <div className="h-5" />}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-400 hover:text-red-500"
                      onClick={() => fields.length > 1 && remove(i)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
              {errors.items?.root && (
                <p className="text-xs text-red-500">{errors.items.root.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Payment instructions, terms, or any notes for the client..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tax Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  {...register("tax_rate", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("discount_amount", { valueAsNumber: true })}
                />
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {watchTax > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax ({watchTax}%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                {watchDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(watchDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  "Create Invoice"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/invoices")}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
