export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'starter' | 'growth' | 'enterprise'
  created_at: string
}

export interface User {
  id: string
  org_id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  org_id: string
  invoice_number: string
  client_name: string
  client_email: string
  amount: number // in cents
  currency: string
  status: InvoiceStatus
  due_date: string
  issued_date: string
  description: string | null
  created_at: string
  updated_at: string
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  org_id: string
  invoice_id: string | null
  type: TransactionType
  category: string
  amount: number // in cents
  currency: string
  description: string
  transaction_date: string
  created_at: string
}

export interface CashFlowEntry {
  id: string
  org_id: string
  forecast_date: string
  projected_inflow: number // in cents
  projected_outflow: number // in cents
  actual_inflow: number // in cents
  actual_outflow: number // in cents
  created_at: string
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskScore {
  id: string
  org_id: string
  client_name: string
  client_email: string
  risk_score: number // 0-100
  risk_level: RiskLevel
  days_overdue_avg: number
  total_outstanding: number // in cents
  last_evaluated_at: string
}

export interface DashboardStats {
  total_ar: number
  total_ap: number
  cash_on_hand: number
  overdue_amount: number
  monthly_cashflow: MonthlyCashFlow[]
  invoice_counts: InvoiceCounts
}

export interface MonthlyCashFlow {
  month: string
  inflow: number
  outflow: number
  net: number
}

export interface InvoiceCounts {
  draft: number
  sent: number
  paid: number
  overdue: number
  cancelled: number
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  orgId: string
  orgName: string
  orgSlug: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
