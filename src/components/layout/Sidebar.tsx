

"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Pill,
  Tags,
  Warehouse,
  Package,
  Boxes,
  AlertTriangle,
  RefreshCcw,
  ShoppingCart,
  Stethoscope,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const menuSections = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      {
        label: "Medicines",
        href: "/medicines",
        icon: Pill,
      },
      {
        label: "Categories",
        href: "/categories",
        icon: Tags,
      },
      {
        label: "Racks & Shelves",
        href: "/racks",
        icon: Warehouse,
      },
      {
        label: "Medicine Batches",
        href: "/medicine-batches",
        icon: Package,
      },
      {
        label: "Stock",
        href: "/stock",
        icon: Boxes,
      },
      {
        label: "Expiry Management",
        href: "/expiry-management",
        icon: AlertTriangle,
      },
      {
        label: "Reorder Recommendations",
        href: "/reorder-recommendations",
        icon: RefreshCcw,
      },
    ],
  },
  {
    title: "PURCHASE",
    items: [
      {
        label: "Purchases",
        href: "/purchases",
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Doctor Visits",
        href: "#",
        icon: Stethoscope,
      },
      {
        label: "Users",
        href: "/users",
        icon: Users,
      },
      {
        label: "Settings",
        href: "#",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
            <Pill className="h-5 w-5" />
          </div>

          <div>
            <div className="text-lg font-bold tracking-tight">
              PharmaTrix
            </div>

            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Medical Management
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

