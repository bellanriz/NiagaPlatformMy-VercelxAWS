import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/header";
import { NewInvoiceForm } from "@/components/invoices/new-invoice-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New Invoice" };

async function getClients() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = cookies();
  const res = await fetch(`${baseUrl}/api/clients?pageSize=100`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default async function NewInvoicePage() {
  const clients = await getClients();

  return (
    <div className="flex flex-col h-full">
      <Header title="New Invoice" subtitle="Create a new invoice for a client" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices" className="gap-2 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Back to invoices
            </Link>
          </Button>
        </div>
        <NewInvoiceForm clients={clients} />
      </div>
    </div>
  );
}
