export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  industry?: string;
  logo_url?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  country?: string;
  currency: string;
  payment_terms: number;
  credit_limit?: number;
  risk_score: number;
  tags?: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Aggregated
  total_invoiced?: number;
  total_paid?: number;
  total_outstanding?: number;
  invoice_count?: number;
}

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  notes?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled"
  | "disputed";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Payment {
  id: string;
  org_id: string;
  invoice_id: string;
  client_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  org_id: string;
  vendor_name: string;
  category?: string;
  description?: string;
  amount: number;
  currency: string;
  expense_date: string;
  due_date?: string;
  status: "pending" | "approved" | "paid" | "cancelled";
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalAR: number;
  totalAP: number;
  overdueAR: number;
  paidThisMonth: number;
  cashBalance: number;
  avgDaysToPayment: number;
  invoiceCount: number;
  overdueCount: number;
  arChange: number;
  apChange: number;
}

export interface AgingBucket {
  bucket: string;
  amount: number;
  count: number;
}

export interface CashFlowPoint {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
  balance: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
