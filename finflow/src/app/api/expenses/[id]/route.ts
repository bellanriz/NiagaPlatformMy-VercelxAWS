import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const updateExpenseSchema = z.object({
  vendor_name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().min(0.01).optional(),
  currency: z.string().optional(),
  expense_date: z.string().optional(),
  due_date: z.string().optional().nullable(),
  status: z.enum(["pending", "approved", "paid", "cancelled"]).optional(),
  receipt_url: z.string().url().optional().nullable(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const result = await query(
      `SELECT e.*, u.name AS created_by_name
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1 AND e.org_id = $2`,
      [params.id, orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error("Expense GET error:", err);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;

    const fields: Array<[keyof typeof d, string]> = [
      ["vendor_name", "vendor_name"],
      ["category", "category"],
      ["description", "description"],
      ["amount", "amount"],
      ["currency", "currency"],
      ["expense_date", "expense_date"],
      ["due_date", "due_date"],
      ["status", "status"],
      ["receipt_url", "receipt_url"],
      ["notes", "notes"],
    ];

    for (const [key, col] of fields) {
      if (d[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(d[key] ?? null);
      }
    }

    values.push(params.id, orgId);

    const result = await query(
      `UPDATE expenses SET ${setClauses.join(", ")}
       WHERE id = $${idx++} AND org_id = $${idx}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error("Expense PATCH error:", err);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    // Only allow deleting pending or cancelled expenses
    const result = await query(
      `DELETE FROM expenses
       WHERE id = $1 AND org_id = $2 AND status IN ('pending','cancelled')
       RETURNING id`,
      [params.id, orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Expense not found or cannot be deleted (only pending/cancelled expenses can be deleted)" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Expense DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
