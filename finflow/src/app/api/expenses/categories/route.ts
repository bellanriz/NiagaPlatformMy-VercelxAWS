import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const result = await query(
      `SELECT
         category,
         COUNT(*)          AS count,
         SUM(amount)       AS total_amount
       FROM expenses
       WHERE org_id = $1 AND category IS NOT NULL
       GROUP BY category
       ORDER BY total_amount DESC`,
      [orgId]
    );

    return NextResponse.json({ data: result.rows });
  } catch (err) {
    console.error("Expense categories error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
