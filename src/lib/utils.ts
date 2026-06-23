import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amountCents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateInput(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'low':
      return 'text-green-600 bg-green-50'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50'
    case 'high':
      return 'text-orange-600 bg-orange-50'
    case 'critical':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getRiskBadgeVariant(level: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'low':
      return 'secondary'
    case 'medium':
      return 'outline'
    case 'high':
    case 'critical':
      return 'destructive'
    default:
      return 'default'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'text-green-700 bg-green-100'
    case 'sent':
      return 'text-blue-700 bg-blue-100'
    case 'draft':
      return 'text-gray-700 bg-gray-100'
    case 'overdue':
      return 'text-red-700 bg-red-100'
    case 'cancelled':
      return 'text-gray-500 bg-gray-50'
    default:
      return 'text-gray-700 bg-gray-100'
  }
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

export function calculateDaysOverdue(dueDate: string | Date): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  const diff = today.getTime() - due.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}
