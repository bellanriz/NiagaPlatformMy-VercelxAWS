import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { NewClientForm } from "@/components/clients/new-client-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New Client" };

export default function NewClientPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="New Client" subtitle="Add a new client to your account" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients" className="gap-2 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Back to clients
            </Link>
          </Button>
        </div>
        <NewClientForm />
      </div>
    </div>
  );
}
