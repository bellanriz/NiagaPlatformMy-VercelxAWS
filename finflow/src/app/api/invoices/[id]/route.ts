import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const updateInvoiceSchema = z.object({
  status: z.enum(["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled", "disputed"]).optional(),
  due_date: z.string().optional(),
  paid_date: z.string().optional().nullable(),
  amount_paid: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const [invoiceResult, itemsResult] = await Promise.all([
      query(
        `SELECT i.*, c.name AS client_name, c.email AS client_email,
                c.company, c.address, c.payment_terms, c.risk_score
         FROM invoices i
         JOIN clients c ON i.client_id = c.id
         WHERE i.id = $1 AND i.org_id = $2`,
        [params.id, orgId]
      ),
      query(
        `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
        [params.id]
      ),
    ]);

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: { ...invoiceResult.rows[0], items: itemsResult.rows },
    });
  } catch (err) {
    console.error("Invoice GET error:", err);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;

    if (d.status !== undefined) { setClauses.push(`status = $${idx++}`); values.push(d.status); }
    if (d.due_date !== undefined) { setClauses.push(`due_date = $${idx++}`); values.push(d.due_date); }
    if (d.paid_date !== undefined) { setClauses.push(`paid_date = $${idx++}`); values.push(d.paid_date); }
    if (d.amount_paid !== undefined) { setClauses.push(`amount_paid = $${idx++}`); values.push(d.amount_paid); }
    if (d.notes !== undefined) { setClauses.push(`notes = $${idx++}`); values.push(d.notes); }
    if (d.terms !== undefined) { setClauses.push(`terms = $${idx++}`); values.push(d.terms); }

    values.push(params.id, orgId);

    const result = await query(
      `UPDATE invoices SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND org_id = $${idx}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error("Invoice PATCH error:", err);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const result = await query(
      `DELETE FROM invoices WHERE id = $1 AND org_id = $2 AND status = 'draft' RETURNING id`,
      [params.id, orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found or cannot be deleted (only drafts can be deleted)" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invoice deleted" });
  } catch (err) {
    console.error("Invoice DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
