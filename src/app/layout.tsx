

import type { Metadata } from "next";

import "./globals.css";

import { Geist } from "next/font/google";

import { cn } from "@/lib/utils";

import { Toaster } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PharmaTrix-Medical Shop Management System",
  description:
    "Medical Shop Management, Inventory, Billing and Doctor Schedule System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
    >
      <body>
        <AdminLayout>
          {children}
        </AdminLayout>

        <Toaster
          position="top-right"
          richColors
        />
      </body>
    </html>
  );
}

