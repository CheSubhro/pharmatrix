

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

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

export default function Sidebar({
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "#") {
      return false;
    }

    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-white",
          "transition-transform duration-200 ease-in-out",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link
            href="/dashboard"
            onClick={onClose}
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

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
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
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={onClose}
                        aria-current={
                          active ? "page" : undefined
                        }
                        className={[
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-black text-white"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        ].join(" ")}
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

      </aside>
    </>
  );
}

