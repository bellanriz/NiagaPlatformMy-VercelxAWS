import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { z } from "zod";

const createPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().min(0.01),
  currency: z.string().default("USD"),
  payment_date: z.string(),
  payment_method: z.enum([
    "bank_transfer",
    "credit_card",
    "check",
    "cash",
    "wire",
    "ach",
    "other",
  ]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
  const clientId = searchParams.get("clientId");
  const invoiceId = searchParams.get("invoiceId");
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["p.org_id = $1"];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (clientId) {
    conditions.push(`p.client_id = $${idx++}`);
    params.push(clientId);
  }
  if (invoiceId) {
    conditions.push(`p.invoice_id = $${idx++}`);
    params.push(invoiceId);
  }

  const where = conditions.join(" AND ");

  try {
    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT
           p.*,
           c.name        AS client_name,
           i.invoice_number,
           i.total_amount AS invoice_total
         FROM payments p
         JOIN clients c  ON p.client_id  = c.id
         JOIN invoices i ON p.invoice_id = i.id
         WHERE ${where}
         ORDER BY p.payment_date DESC, p.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, pageSize, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM payments p WHERE ${where}`,
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
    console.error("Payments GET error:", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const result = await transaction(async (client) => {
      // Lock the invoice row
      const invoiceRes = await client.query(
        `SELECT id, client_id, total_amount, amount_paid, amount_due, status
         FROM invoices
         WHERE id = $1 AND org_id = $2
         FOR UPDATE`,
        [d.invoice_id, orgId]
      );

      if (invoiceRes.rows.length === 0) {
        throw new Error("INVOICE_NOT_FOUND");
      }

      const invoice = invoiceRes.rows[0];

      if (["paid", "cancelled"].includes(invoice.status)) {
        throw new Error("INVOICE_ALREADY_CLOSED");
      }

      if (d.amount > Number(invoice.amount_due)) {
        throw new Error("OVERPAYMENT");
      }

      // Record payment
      const paymentRes = await client.query(
        `INSERT INTO payments
           (org_id, invoice_id, client_id, amount, currency,
            payment_date, payment_method, reference, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          orgId, d.invoice_id, invoice.client_id,
          d.amount, d.currency, d.payment_date,
          d.payment_method || null, d.reference || null, d.notes || null,
        ]
      );

      // Update invoice amount_paid and status
      const newAmountPaid = Number(invoice.amount_paid) + d.amount;
      const newStatus =
        newAmountPaid >= Number(invoice.total_amount)
          ? "paid"
          : "partial";

      await client.query(
        `UPDATE invoices
         SET amount_paid = $1,
             status      = $2,
             paid_date   = CASE WHEN $2 = 'paid' THEN $3::date ELSE paid_date END,
             updated_at  = NOW()
         WHERE id = $4`,
        [newAmountPaid, newStatus, d.payment_date, d.invoice_id]
      );

      return paymentRes.rows[0];
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: any) {
    const msg = err.message;
    if (msg === "INVOICE_NOT_FOUND")
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (msg === "INVOICE_ALREADY_CLOSED")
      return NextResponse.json({ error: "Invoice is already paid or cancelled" }, { status: 409 });
    if (msg === "OVERPAYMENT")
      return NextResponse.json({ error: "Payment amount exceeds outstanding balance" }, { status: 422 });

    console.error("Payments POST error:", err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
