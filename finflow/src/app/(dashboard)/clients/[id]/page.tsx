import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ClientDetail } from "@/components/clients/client-detail";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: { id: string };
}

async function getClient(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cookieStore = cookies();
  const res = await fetch(`${baseUrl}/api/clients/${id}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch client");
  const json = await res.json();
  return json.data;
}

export async function generateMetadata({ params }: PageProps) {
  const client = await getClient(params.id);
  return { title: client ? client.name : "Client" };
}

export default async function ClientDetailPage({ params }: PageProps) {
  const client = await getClient(params.id);
  if (!client) notFound();

  return (
    <div className="flex flex-col h-full">
      <Header title={client.name} subtitle={client.company ?? "Client Profile"} />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients" className="gap-2 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Back to clients
            </Link>
          </Button>
        </div>
        <ClientDetail client={client} />
      </div>
    </div>
  );
}
