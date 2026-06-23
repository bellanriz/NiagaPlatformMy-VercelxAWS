import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  invoice_number: z.string().min(1),
  status: z.enum(["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled", "disputed"]).default("draft"),
  issue_date: z.string(),
  due_date: z.string(),
  subtotal: z.number().min(0),
  tax_rate: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(0.001),
    unit_price: z.number().min(0),
  })).min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const search = searchParams.get("search");
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["i.org_id = $1"];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (status && status !== "all") {
    conditions.push(`i.status = $${idx++}`);
    params.push(status);
  }
  if (clientId) {
    conditions.push(`i.client_id = $${idx++}`);
    params.push(clientId);
  }
  if (search) {
    conditions.push(`(i.invoice_number ILIKE $${idx} OR c.name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.join(" AND ");

  try {
    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT i.*, c.name AS client_name, c.email AS client_email
         FROM invoices i
         JOIN clients c ON i.client_id = c.id
         WHERE ${where}
         ORDER BY i.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, pageSize, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM invoices i JOIN clients c ON i.client_id = c.id WHERE ${where}`,
        params
      ),
    ]);

    const total = Number((countResult.rows[0] as any).total);

    return NextResponse.json({
      data: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("Invoices GET error:", err);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const userId = session.user.id;

  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const taxAmount = (d.subtotal * d.tax_rate) / 100;
    const totalAmount = d.subtotal + taxAmount - d.discount_amount;

    const invoiceResult = await query(
      `INSERT INTO invoices
        (org_id, client_id, invoice_number, status, issue_date, due_date,
         subtotal, tax_rate, tax_amount, discount_amount, total_amount,
         currency, notes, terms, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [orgId, d.client_id, d.invoice_number, d.status,
       d.issue_date, d.due_date, d.subtotal, d.tax_rate,
       taxAmount, d.discount_amount, totalAmount,
       d.currency, d.notes ?? null, d.terms ?? null, userId]
    );

    const invoice = invoiceResult.rows[0] as any;

    // Insert line items
    for (const item of d.items) {
      await query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [invoice.id, item.description, item.quantity, item.unit_price]
      );
    }

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Invoice number already exists" }, { status: 409 });
    }
    console.error("Invoices POST error:", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
