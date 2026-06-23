import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "USD",
  compact = false
): string {
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function getDaysOverdue(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = today.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getAgingBucket(dueDate: string | Date): string {
  const days = getDaysOverdue(dueDate);
  if (days <= 0) return "current";
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

export function getRiskColor(score: number): string {
  if (score < 30) return "text-green-600";
  if (score < 60) return "text-yellow-600";
  return "text-red-600";
}

export function getRiskLabel(score: number): string {
  if (score < 30) return "Low";
  if (score < 60) return "Medium";
  return "High";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    sent: "bg-blue-100 text-blue-800",
    viewed: "bg-purple-100 text-purple-800",
    partial: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
    cancelled: "bg-gray-100 text-gray-500",
    disputed: "bg-orange-100 text-orange-800",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export function generateInvoiceNumber(prefix = "INV"): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${rand}`;
}
