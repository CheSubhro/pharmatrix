
import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}