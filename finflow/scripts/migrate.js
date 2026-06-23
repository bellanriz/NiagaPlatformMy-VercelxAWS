/**
 * Database migration script for FinFlow
 * Run: node scripts/migrate.js
 *
 * Creates all required tables in Aurora PostgreSQL
 */

const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const migrations = [
  // Organizations (tenants)
  `CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter','growth','enterprise')),
    industry VARCHAR(100),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Users
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Clients (customers of the org)
  `CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    country VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_terms INTEGER DEFAULT 30,
    credit_limit NUMERIC(15,2),
    risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
    tags TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Invoices
  `CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','partial','paid','overdue','cancelled','disputed')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    amount_due NUMERIC(15,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT,
    terms TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, invoice_number)
  )`,

  // Invoice line items
  `CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    amount NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Payments
  `CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100),
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Expenses / Accounts Payable
  `CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    expense_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Cash flow forecasts
  `CREATE TABLE IF NOT EXISTS cashflow_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    expected_inflow NUMERIC(15,2) DEFAULT 0,
    expected_outflow NUMERIC(15,2) DEFAULT 0,
    actual_inflow NUMERIC(15,2),
    actual_outflow NUMERIC(15,2),
    opening_balance NUMERIC(15,2),
    closing_balance NUMERIC(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, forecast_date)
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(org_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON expenses(org_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
];

async function migrate() {
  const client = await pool.connect();
  console.log("🚀 Running FinFlow database migrations...\n");

  try {
    await client.query("BEGIN");

    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const name = sql.split("\n")[0].replace("CREATE ", "").substring(0, 60);
      process.stdout.write(`  [${i + 1}/${migrations.length}] ${name}... `);
      await client.query(sql);
      console.log("✓");
    }

    await client.query("COMMIT");
    console.log("\n✅ All migrations completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
