"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/cashflow", label: "Cash Flow", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  orgName: string;
  userName: string;
  userEmail: string;
}

export function Sidebar({ orgName, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Niaga Platform</p>
          <p className="text-xs text-gray-500 truncate max-w-[140px]">{orgName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-blue-700" : "text-gray-400 group-hover:text-gray-600")} />
              {label}
              {active && <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Org badge */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-900">{userName}</p>
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
