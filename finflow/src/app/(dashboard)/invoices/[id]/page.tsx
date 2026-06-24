import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: { id: string };
}

async function getInvoice(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = cookies();
  const res = await fetch(`${baseUrl}/api/invoices/${id}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch invoice");
  const json = await res.json();
  return json.data;
}

export async function generateMetadata({ params }: PageProps) {
  const invoice = await getInvoice(params.id);
  return { title: invoice ? `Invoice ${invoice.invoice_number}` : "Invoice" };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

  return (
    <div className="flex flex-col h-full">
      <Header title={`Invoice ${invoice.invoice_number}`} subtitle={invoice.client_name} />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices" className="gap-2 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Back to invoices
            </Link>
          </Button>
        </div>
        <InvoiceDetail invoice={invoice} />
      </div>
    </div>
  );
}
