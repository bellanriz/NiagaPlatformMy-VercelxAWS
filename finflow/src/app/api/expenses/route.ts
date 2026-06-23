import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const createExpenseSchema = z.object({
  vendor_name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().min(0.01),
  currency: z.string().default("USD"),
  expense_date: z.string(),
  due_date: z.string().optional(),
  status: z.enum(["pending", "approved", "paid", "cancelled"]).default("pending"),
  receipt_url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["org_id = $1"];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (status && status !== "all") {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`(vendor_name ILIKE $${idx} OR description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.join(" AND ");

  try {
    const [dataResult, countResult, summaryResult] = await Promise.all([
      query(
        `SELECT * FROM expenses
         WHERE ${where}
         ORDER BY expense_date DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, pageSize, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM expenses WHERE ${where}`, params),
      query(
        `SELECT
           COALESCE(SUM(CASE WHEN status IN ('pending','approved') THEN amount ELSE 0 END), 0) AS total_pending,
           COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)                  AS total_paid,
           COALESCE(SUM(amount), 0)                                                             AS total_all
         FROM expenses WHERE org_id = $1`,
        [orgId]
      ),
    ]);

    const total = Number((countResult.rows[0] as any).total);
    const summary = summaryResult.rows[0] as any;

    return NextResponse.json({
      data: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        total_pending: Number(summary.total_pending),
        total_paid: Number(summary.total_paid),
        total_all: Number(summary.total_all),
      },
    });
  } catch (err) {
    console.error("Expenses GET error:", err);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const userId = session.user.id;

  try {
    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const result = await query(
      `INSERT INTO expenses
         (org_id, vendor_name, category, description, amount, currency,
          expense_date, due_date, status, receipt_url, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        orgId, d.vendor_name, d.category || null, d.description || null,
        d.amount, d.currency, d.expense_date, d.due_date || null,
        d.status, d.receipt_url || null, d.notes || null, userId,
      ]
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Expenses POST error:", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
