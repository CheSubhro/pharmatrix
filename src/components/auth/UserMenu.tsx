
"use client";

import { signOut } from "next-auth/react";

interface UserMenuProps {
  name?: string | null;
  role?: string | null;
}

export default function UserMenu({
  name,
  role,
}: UserMenuProps) {
  async function handleLogout() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium">
          {name}
        </p>

        <p className="text-xs text-gray-500">
          {role}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
      >
        Logout
      </button>
    </div>
  );
}