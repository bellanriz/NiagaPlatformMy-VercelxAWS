import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import type { DashboardMetrics, AgingBucket, CashFlowPoint } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = (session.user as any).orgId;

  try {
    // Core AR/AP metrics
    const metricsResult = await query<DashboardMetrics>(
      `SELECT
        COALESCE(SUM(CASE WHEN status NOT IN ('paid','cancelled') THEN amount_due ELSE 0 END), 0) AS "totalAR",
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount_due ELSE 0 END), 0) AS "overdueAR",
        COALESCE(SUM(CASE WHEN status = 'paid' AND DATE_TRUNC('month', paid_date) = DATE_TRUNC('month', NOW()) THEN total_amount ELSE 0 END), 0) AS "paidThisMonth",
        COUNT(*) AS "invoiceCount",
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) AS "overdueCount"
      FROM invoices
      WHERE org_id = $1`,
      [orgId]
    );

    // AP (expenses)
    const apResult = await query<{ totalAP: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS "totalAP"
       FROM expenses
       WHERE org_id = $1 AND status IN ('pending','approved')`,
      [orgId]
    );

    // Avg days to payment
    const avgDaysResult = await query<{ avg_days: number }>(
      `SELECT COALESCE(AVG(EXTRACT(DAY FROM paid_date::timestamp - issue_date::timestamp)), 0) AS avg_days
       FROM invoices
       WHERE org_id = $1 AND status = 'paid' AND paid_date IS NOT NULL`,
      [orgId]
    );

    // AR aging buckets
    const agingResult = await query<AgingBucket>(
      `SELECT
        CASE
          WHEN due_date >= CURRENT_DATE THEN 'Current'
          WHEN due_date >= CURRENT_DATE - 30 THEN '1-30 days'
          WHEN due_date >= CURRENT_DATE - 60 THEN '31-60 days'
          WHEN due_date >= CURRENT_DATE - 90 THEN '61-90 days'
          ELSE '90+ days'
        END AS bucket,
        COALESCE(SUM(amount_due), 0) AS amount,
        COUNT(*) AS count
      FROM invoices
      WHERE org_id = $1 AND status NOT IN ('paid','cancelled','draft')
      GROUP BY 1
      ORDER BY MIN(due_date)`,
      [orgId]
    );

    // Monthly cash flow (last 6 months)
    const cashFlowResult = await query<CashFlowPoint>(
      `WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
          DATE_TRUNC('month', NOW()),
          '1 month'
        ) AS month
      ),
      inflows AS (
        SELECT DATE_TRUNC('month', paid_date) AS month, SUM(total_amount) AS inflow
        FROM invoices
        WHERE org_id = $1 AND status = 'paid' AND paid_date IS NOT NULL
        GROUP BY 1
      ),
      outflows AS (
        SELECT DATE_TRUNC('month', expense_date) AS month, SUM(amount) AS outflow
        FROM expenses
        WHERE org_id = $1
        GROUP BY 1
      )
      SELECT
        TO_CHAR(m.month, 'Mon YY') AS month,
        COALESCE(i.inflow, 0) AS inflow,
        COALESCE(o.outflow, 0) AS outflow,
        COALESCE(i.inflow, 0) - COALESCE(o.outflow, 0) AS net,
        0 AS balance
      FROM months m
      LEFT JOIN inflows i ON i.month = m.month
      LEFT JOIN outflows o ON o.month = m.month
      ORDER BY m.month`,
      [orgId]
    );

    const metrics = metricsResult.rows[0];
    const apMetrics = apResult.rows[0];

    return NextResponse.json({
      metrics: {
        totalAR: Number(metrics.totalAR),
        totalAP: Number(apMetrics.totalAP),
        overdueAR: Number(metrics.overdueAR),
        paidThisMonth: Number(metrics.paidThisMonth),
        cashBalance: Number(metrics.paidThisMonth) - Number(apMetrics.totalAP),
        avgDaysToPayment: Math.round(Number(avgDaysResult.rows[0]?.avg_days ?? 0)),
        invoiceCount: Number(metrics.invoiceCount),
        overdueCount: Number(metrics.overdueCount),
        arChange: 5.2,
        apChange: -2.1,
      },
      aging: agingResult.rows.map((r) => ({
        bucket: r.bucket,
        amount: Number(r.amount),
        count: Number(r.count),
      })),
      cashFlow: cashFlowResult.rows.map((r) => ({
        month: r.month,
        inflow: Number(r.inflow),
        outflow: Number(r.outflow),
        net: Number(r.net),
        balance: Number(r.balance),
      })),
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
