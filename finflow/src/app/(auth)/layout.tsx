import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Already logged in — send to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
