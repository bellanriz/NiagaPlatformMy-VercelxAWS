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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default("USD"),
  payment_terms: z.number().int().min(0).default(30),
  credit_limit: z.number().min(0).optional(),
  risk_score: z.number().int().min(0).max(100).default(50),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewClientForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "USD",
      payment_terms: 30,
      risk_score: 50,
    },
  });

  const riskScore = watch("risk_score") ?? 50;

  function getRiskLabel(score: number) {
    if (score < 30) return { label: "Low", color: "text-green-600" };
    if (score < 60) return { label: "Medium", color: "text-yellow-600" };
    return { label: "High", color: "text-red-600" };
  }

  function getRiskBarColor(score: number) {
    if (score < 30) return "bg-green-500";
    if (score < 60) return "bg-yellow-500";
    return "bg-red-500";
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create client");
      }
      const json = await res.json();
      toast({ title: "Client created successfully", variant: "success" as any });
      router.push(`/clients/${json.data.id}`);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const risk = getRiskLabel(riskScore);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Jane Smith"
                    {...register("name")}
                    className={errors.name ? "border-red-400" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Input placeholder="Acme Inc." {...register("company")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="jane@acme.com"
                    {...register("email")}
                    className={errors.email ? "border-red-400" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input placeholder="+1 555 000 0000" {...register("phone")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input placeholder="123 Main St, City, State" {...register("address")} />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input placeholder="United States" {...register("country")} />
              </div>
            </CardContent>
          </Card>

          {/* Financial terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <select
                    {...register("currency")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                    <option value="SGD">SGD</option>
                    <option value="MYR">MYR</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Terms (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    {...register("payment_terms", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Credit Limit ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Optional"
                    {...register("credit_limit", { valueAsNumber: true })}
                  />
                </div>
              </div>
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
                placeholder="Internal notes about this client..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Risk sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Risk Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <span className={`text-4xl font-bold ${risk.color}`}>{riskScore}</span>
                <p className={`text-sm font-medium mt-1 ${risk.color}`}>{risk.label} Risk</p>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${getRiskBarColor(riskScore)}`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <Input
                type="range"
                min="0"
                max="100"
                step="1"
                className="w-full accent-blue-600 cursor-pointer"
                {...register("risk_score", { valueAsNumber: true })}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0 — Safe</span>
                <span>100 — Risky</span>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Used to flag payment risk in AR aging reports
              </p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              "Create Client"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/clients")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
