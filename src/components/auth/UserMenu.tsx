

"use client";

import { useEffect, useState } from "react";
import {
  getSession,
  signOut,
} from "next-auth/react";
import {
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";

interface UserMenuProps {
  name?: string | null;
  role?: string | null;
}

export default function UserMenu({
  name,
  role,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(
    name ?? null,
  );
  const [sessionRole, setSessionRole] = useState<string | null>(
    role ?? null,
  );

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const session = await getSession();

        if (!mounted) return;

        setSessionName(session?.user?.name ?? name ?? null);

        const userWithRole = session?.user as
          | { role?: string | null }
          | undefined;

        setSessionRole(
          userWithRole?.role ?? role ?? null,
        );
      } catch (error) {
        console.error(
          "Failed to load user session:",
          error,
        );
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [name, role]);

  async function handleLogout() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  const displayName = sessionName || "Admin";
  const displayRole = sessionRole || "Administrator";

  const initial = displayName
    .charAt(0)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
          {initial}
        </div>

        <div className="hidden text-left sm:block">
          <p className="max-w-[120px] truncate text-sm font-medium">
            {displayName}
          </p>

          <p className="text-[11px] text-muted-foreground">
            {displayRole}
          </p>
        </div>

        <ChevronDown
          className={[
            "hidden h-4 w-4 text-muted-foreground transition-transform sm:block",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border bg-white p-2 shadow-lg"
          role="menu"
        >
          <div className="flex items-center gap-3 rounded-lg px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
              {initial}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {displayName}
              </p>

              <p className="text-xs text-muted-foreground">
                {displayRole}
              </p>
            </div>
          </div>

          <div className="my-1 border-t" />

          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground opacity-60"
            role="menuitem"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>

          <div className="my-1 border-t" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

