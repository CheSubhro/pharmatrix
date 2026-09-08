

"use client";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />

      <Navbar />

      <main className="ml-64 pt-16">
        <div className="min-h-[calc(100vh-4rem)] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

