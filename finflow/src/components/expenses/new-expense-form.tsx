"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Software", "Payroll", "Rent", "Marketing",
  "Utilities", "Travel", "Equipment", "Insurance",
  "Legal", "Accounting", "Office Supplies", "Other",
];

const schema = z.object({
  vendor_name: z.string().min(1, "Vendor name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("USD"),
  expense_date: z.string(),
  due_date: z.string().optional(),
  status: z.enum(["pending", "approved", "paid", "cancelled"]).default("pending"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewExpenseForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "USD",
      expense_date: today,
      status: "pending",
    },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create expense");
      }
      toast({ title: "Expense logged successfully", variant: "success" as any });
      router.push("/expenses");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Vendor Name *</Label>
              <Input
                placeholder="AWS, Stripe, etc."
                {...register("vendor_name")}
                className={errors.vendor_name ? "border-red-400" : ""}
              />
              {errors.vendor_name && <p className="text-xs text-red-500">{errors.vendor_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                {...register("category")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="Brief description of the expense..." {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
                className={errors.amount ? "border-red-400" : ""}
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <select
                {...register("currency")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="MYR">MYR</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Expense Date *</Label>
              <Input type="date" {...register("expense_date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              {...register("status")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Any additional notes..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            "Save Expense"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/expenses")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
