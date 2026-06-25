"use client";

import { useState } from "react";
import { Building2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  orgName: string;
  orgSlug: string;
  plan: string;
}

const PLANS = [
  {
    id: "starter",
    label: "Starter",
    price: "Free",
    features: ["Up to 3 users", "50 invoices/month", "Basic reporting"],
  },
  {
    id: "growth",
    label: "Growth",
    price: "$49/mo",
    features: ["Up to 15 users", "Unlimited invoices", "Advanced analytics", "Cash flow forecasting"],
    recommended: true,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    price: "Custom",
    features: ["Unlimited users", "Custom integrations", "Dedicated support", "SLA guarantee"],
  },
];

export function OrgSettings({ orgName, orgSlug, plan }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Organization updated", variant: "success" as any });
    }, 800);
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-400" />
          <div>
            <CardTitle className="text-base">Organization</CardTitle>
            <CardDescription>Your workspace settings and billing plan</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Organization Name</Label>
            <Input defaultValue={orgName} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input defaultValue={orgSlug} disabled className="bg-gray-50 font-mono text-sm" />
            <p className="text-xs text-gray-400">Used in URLs, cannot be changed</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} variant="outline">
          {saving ? "Saving..." : "Update Organization"}
        </Button>

        {/* Plan selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <Label className="text-sm font-semibold">Billing Plan</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "relative rounded-lg border p-4 cursor-pointer transition-all",
                  plan === p.id
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {p.recommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    Recommended
                  </span>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{p.label}</span>
                  <span className="text-sm font-bold text-blue-600">{p.price}</span>
                </div>
                <ul className="space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan === p.id && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-blue-700">Current plan</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
