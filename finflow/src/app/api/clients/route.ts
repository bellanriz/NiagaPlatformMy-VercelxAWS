import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default("USD"),
  payment_terms: z.number().int().min(0).default(30),
  credit_limit: z.number().min(0).optional(),
  risk_score: z.number().int().min(0).max(100).default(50),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
  const search = searchParams.get("search");
  const riskFilter = searchParams.get("risk"); // low | medium | high
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["c.org_id = $1", "c.is_active = true"];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (search) {
    conditions.push(`(c.name ILIKE $${idx} OR c.company ILIKE $${idx} OR c.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (riskFilter === "low") {
    conditions.push(`c.risk_score < 30`);
  } else if (riskFilter === "medium") {
    conditions.push(`c.risk_score >= 30 AND c.risk_score < 60`);
  } else if (riskFilter === "high") {
    conditions.push(`c.risk_score >= 60`);
  }

  const where = conditions.join(" AND ");

  try {
    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT
           c.*,
           COALESCE(SUM(i.total_amount), 0)  AS total_invoiced,
           COALESCE(SUM(i.amount_paid), 0)   AS total_paid,
           COALESCE(SUM(i.amount_due), 0)    AS total_outstanding,
           COUNT(i.id)                        AS invoice_count
         FROM clients c
         LEFT JOIN invoices i ON i.client_id = c.id AND i.status NOT IN ('cancelled','draft')
         WHERE ${where}
         GROUP BY c.id
         ORDER BY c.name ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, pageSize, offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM clients c WHERE ${where}`,
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
    console.error("Clients GET error:", err);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;

    const result = await query(
      `INSERT INTO clients
         (org_id, name, email, phone, company, address, country,
          currency, payment_terms, credit_limit, risk_score, tags, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        orgId, d.name, d.email || null, d.phone || null,
        d.company || null, d.address || null, d.country || null,
        d.currency, d.payment_terms, d.credit_limit ?? null,
        d.risk_score, d.tags ?? [], d.notes || null,
      ]
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Clients POST error:", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
