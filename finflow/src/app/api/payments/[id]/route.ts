import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query, transaction } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    const result = await query(
      `SELECT
         p.*,
         c.name         AS client_name,
         i.invoice_number,
         i.total_amount AS invoice_total,
         i.amount_due   AS invoice_balance
       FROM payments p
       JOIN clients c  ON p.client_id  = c.id
       JOIN invoices i ON p.invoice_id = i.id
       WHERE p.id = $1 AND p.org_id = $2`,
      [params.id, orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error("Payment GET error:", err);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}

// Void a payment — reverses the amount on the invoice
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  try {
    await transaction(async (client) => {
      // Fetch payment
      const paymentRes = await client.query(
        `SELECT * FROM payments WHERE id = $1 AND org_id = $2 FOR UPDATE`,
        [params.id, orgId]
      );

      if (paymentRes.rows.length === 0) throw new Error("NOT_FOUND");

      const payment = paymentRes.rows[0];

      // Reverse on invoice
      const invoiceRes = await client.query(
        `SELECT amount_paid, total_amount FROM invoices WHERE id = $1 FOR UPDATE`,
        [payment.invoice_id]
      );

      if (invoiceRes.rows.length === 0) throw new Error("NOT_FOUND");

      const invoice = invoiceRes.rows[0];
      const newAmountPaid = Math.max(0, Number(invoice.amount_paid) - Number(payment.amount));
      const newStatus = newAmountPaid === 0 ? "sent" : "partial";

      await client.query(
        `UPDATE invoices
         SET amount_paid = $1, status = $2, paid_date = NULL, updated_at = NOW()
         WHERE id = $3`,
        [newAmountPaid, newStatus, payment.invoice_id]
      );

      // Delete payment record
      await client.query(`DELETE FROM payments WHERE id = $1`, [params.id]);
    });

    return NextResponse.json({ message: "Payment voided and invoice balance restored" });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    console.error("Payment DELETE error:", err);
    return NextResponse.json({ error: "Failed to void payment" }, { status: 500 });
  }
}
