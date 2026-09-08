
"use client";

import { Bell, Menu, Search } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({
  onMenuClick,
}: NavbarProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b bg-white md:left-64">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-sm font-semibold text-foreground">
              Medical Shop Management System
            </h1>

            <p className="hidden text-xs text-muted-foreground sm:block">
              Manage your pharmacy efficiently
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">
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

          <div className="ml-1 border-l pl-2 sm:ml-2 sm:pl-3">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

