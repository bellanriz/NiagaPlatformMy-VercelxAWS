import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  payment_terms: z.number().int().min(0).optional(),
  credit_limit: z.number().min(0).optional().nullable(),
  risk_score: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const [clientResult, invoicesResult, statsResult] = await Promise.all([
      query(
        `SELECT * FROM clients WHERE id = $1 AND org_id = $2`,
        [params.id, orgId]
      ),
      query(
        `SELECT id, invoice_number, status, issue_date, due_date,
                total_amount, amount_paid, amount_due, currency
         FROM invoices
         WHERE client_id = $1 AND org_id = $2
         ORDER BY created_at DESC
         LIMIT 10`,
        [params.id, orgId]
      ),
      query(
        `SELECT
           COALESCE(SUM(total_amount), 0)  AS total_invoiced,
           COALESCE(SUM(amount_paid), 0)   AS total_paid,
           COALESCE(SUM(amount_due), 0)    AS total_outstanding,
           COUNT(*)                         AS invoice_count,
           AVG(CASE WHEN status = 'paid' AND paid_date IS NOT NULL
               THEN EXTRACT(DAY FROM paid_date::timestamp - issue_date::timestamp)
               END)                         AS avg_days_to_pay
         FROM invoices
         WHERE client_id = $1 AND org_id = $2 AND status != 'cancelled'`,
        [params.id, orgId]
      ),
    ]);

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...clientResult.rows[0],
        recentInvoices: invoicesResult.rows,
        stats: {
          total_invoiced: Number(statsResult.rows[0].total_invoiced),
          total_paid: Number(statsResult.rows[0].total_paid),
          total_outstanding: Number(statsResult.rows[0].total_outstanding),
          invoice_count: Number(statsResult.rows[0].invoice_count),
          avg_days_to_pay: Math.round(Number(statsResult.rows[0].avg_days_to_pay ?? 0)),
        },
      },
    });
  } catch (err) {
    console.error("Client GET error:", err);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;

    const fields: Array<[keyof typeof d, string]> = [
      ["name", "name"], ["email", "email"], ["phone", "phone"],
      ["company", "company"], ["address", "address"], ["country", "country"],
      ["currency", "currency"], ["payment_terms", "payment_terms"],
      ["credit_limit", "credit_limit"], ["risk_score", "risk_score"],
      ["tags", "tags"], ["notes", "notes"], ["is_active", "is_active"],
    ];

    for (const [key, col] of fields) {
      if (d[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(d[key] ?? null);
      }
    }

    values.push(params.id, orgId);

    const result = await query(
      `UPDATE clients SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND org_id = $${idx}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error("Client PATCH error:", err);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    // Soft delete — check for outstanding invoices first
    const outstandingResult = await query(
      `SELECT COUNT(*) AS cnt FROM invoices
       WHERE client_id = $1 AND org_id = $2 AND status NOT IN ('paid','cancelled')`,
      [params.id, orgId]
    );

    if (Number((outstandingResult.rows[0] as any).cnt) > 0) {
      return NextResponse.json(
        { error: "Cannot deactivate client with outstanding invoices" },
        { status: 409 }
      );
    }

    const result = await query(
      `UPDATE clients SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING id`,
      [params.id, orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client deactivated" });
  } catch (err) {
    console.error("Client DELETE error:", err);
    return NextResponse.json({ error: "Failed to deactivate client" }, { status: 500 });
  }
}
