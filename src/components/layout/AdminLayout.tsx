

"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Login page should not show Sidebar or Navbar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Navbar
        onMenuClick={() => setMobileOpen(true)}
      />

      <main className="ml-0 pt-16 md:ml-64">
        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

