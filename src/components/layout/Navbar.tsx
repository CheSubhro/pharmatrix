

"use client";

import { Bell, Search } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";

export default function Navbar() {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b bg-white">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left */}
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            Medical Shop Management System
          </h1>

          <p className="text-xs text-muted-foreground">
            Manage your pharmacy efficiently
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />

            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-black" />
          </button>

          <div className="ml-2 border-l pl-3">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

