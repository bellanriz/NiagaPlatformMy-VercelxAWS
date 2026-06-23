/**
 * Seed script — populates demo data for FinFlow
 * Run: node scripts/seed.js
 */

const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Simple bcrypt-like hash using Node crypto (replace with bcryptjs in prod)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password + "salt123").digest("hex");
}

async function seed() {
  const client = await pool.connect();
  console.log("🌱 Seeding FinFlow demo data...\n");

  try {
    await client.query("BEGIN");

    // Org
    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug, plan, industry)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ["Acme Corp", "acme-corp", "growth", "Technology"]
    );
    const orgId = orgResult.rows[0].id;
    console.log("  ✓ Organization: Acme Corp");

    // Admin user
    await client.query(
      `INSERT INTO users (org_id, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [orgId, "admin@acme.com", "Alex Johnson", hashPassword("password123"), "owner"]
    );
    console.log("  ✓ User: admin@acme.com / password123");

    // Clients
    const clients = [
      { name: "TechStart Inc", email: "billing@techstart.io", company: "TechStart Inc", risk: 25, terms: 30 },
      { name: "Global Media Ltd", email: "ap@globalmedia.com", company: "Global Media Ltd", risk: 45, terms: 45 },
      { name: "RetailChain Co", email: "finance@retailchain.com", company: "RetailChain Co", risk: 70, terms: 15 },
      { name: "HealthPlus", email: "accounts@healthplus.org", company: "HealthPlus", risk: 20, terms: 30 },
      { name: "BuildRight LLC", email: "invoices@buildright.com", company: "BuildRight LLC", risk: 60, terms: 60 },
    ];

    const clientIds = [];
    for (const c of clients) {
      const r = await client.query(
        `INSERT INTO clients (org_id, name, email, company, risk_score, payment_terms)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [orgId, c.name, c.email, c.company, c.risk, c.terms]
      );
      if (r.rows[0]) clientIds.push(r.rows[0].id);
    }
    console.log(`  ✓ ${clientIds.length} clients`);

    // Invoices
    const statuses = ["paid", "sent", "overdue", "partial", "paid", "sent", "overdue", "paid", "draft", "paid"];
    const invoices = [];
    for (let i = 0; i < 20; i++) {
      const clientId = clientIds[i % clientIds.length];
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - (i * 7));
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const total = (Math.random() * 15000 + 1000).toFixed(2);
      const status = statuses[i % statuses.length];
      const amountPaid = status === "paid" ? total : status === "partial" ? (total * 0.5).toFixed(2) : "0";

      const r = await client.query(
        `INSERT INTO invoices (org_id, client_id, invoice_number, status, issue_date, due_date, subtotal, total_amount, amount_paid, currency)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'USD')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [orgId, clientId, `INV-2024-${String(i + 1).padStart(4, "0")}`, status,
          issueDate.toISOString().split("T")[0],
          dueDate.toISOString().split("T")[0],
          total, total, amountPaid]
      );
      if (r.rows[0]) invoices.push(r.rows[0].id);
    }
    console.log(`  ✓ ${invoices.length} invoices`);

    // Expenses
    const expenseCategories = ["Software", "Payroll", "Rent", "Marketing", "Utilities", "Travel"];
    for (let i = 0; i < 10; i++) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() - (i * 5));
      await client.query(
        `INSERT INTO expenses (org_id, vendor_name, category, amount, expense_date, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orgId, `Vendor ${i + 1}`, expenseCategories[i % expenseCategories.length],
          (Math.random() * 5000 + 500).toFixed(2),
          expDate.toISOString().split("T")[0],
          i % 3 === 0 ? "paid" : "pending"]
      );
    }
    console.log("  ✓ 10 expenses");

    await client.query("COMMIT");
    console.log("\n✅ Seed completed. Login: admin@acme.com / password123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
