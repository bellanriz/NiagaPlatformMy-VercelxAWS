import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Niaga Platform",
    template: "%s | Niaga Platform",
  },
  description:
    "B2B cash flow intelligence platform — invoice management, AR/AP tracking, and financial forecasting for modern finance teams.",
  keywords: ["invoicing", "cash flow", "accounts receivable", "B2B finance", "SaaS"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
