"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const RISK_TABS = [
  { label: "All", value: "" },
  { label: "Low Risk", value: "low" },
  { label: "Medium Risk", value: "medium" },
  { label: "High Risk", value: "high" },
];

interface ClientFiltersProps {
  currentSearch?: string;
  currentRisk?: string;
}

export function ClientFilters({ currentSearch, currentRisk }: ClientFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      if (currentRisk) params.set("risk", currentRisk);
      if (currentSearch) params.set("search", currentSearch);
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [currentRisk, currentSearch, pathname, router]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-1">
      {/* Risk tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
        {RISK_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateParams({ risk: tab.value || undefined })}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              (currentRisk ?? "") === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search clients..."
          defaultValue={currentSearch}
          className="pl-9 pr-8"
          onChange={(e) => {
            const val = e.target.value;
            const timer = setTimeout(() => updateParams({ search: val || undefined }), 400);
            return () => clearTimeout(timer);
          }}
        />
        {currentSearch && (
          <button
            onClick={() => updateParams({ search: undefined })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
