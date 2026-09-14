

import type { Metadata } from "next";

import "./globals.css";

import { Toaster } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";

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
    <html lang="en">
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

