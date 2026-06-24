import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { NewExpenseForm } from "@/components/expenses/new-expense-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New Expense" };

export default function NewExpensePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="New Expense" subtitle="Log a new business expense" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/expenses" className="gap-2 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Back to expenses
            </Link>
          </Button>
        </div>
        <NewExpenseForm />
      </div>
    </div>
  );
}
