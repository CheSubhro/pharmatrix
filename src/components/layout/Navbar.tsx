

"use client";

import {
  Bell,
  Menu,
  Search,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import UserMenu from "@/components/auth/UserMenu";

interface NavbarProps {
  onMenuClick: () => void;
}

interface LowStockMedicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  minimumStock: number;
  currentStock?: number;
  stock?: number;
}

interface DashboardResponse {
  success: boolean;
  message?: string;
  dashboard?: {
    lowStockCount?: number;
    lowStockMedicines?: LowStockMedicine[];
  };
}

export default function Navbar({
  onMenuClick,
}: NavbarProps) {
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [lowStockMedicines, setLowStockMedicines] =
    useState<LowStockMedicine[]>([]);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  // Fetch low stock notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const response = await fetch(
        "/api/dashboard",
        {
          cache: "no-store",
        }
      );

      const data: DashboardResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch notifications"
        );
      }

      setLowStockMedicines(
        data.dashboard?.lowStockMedicines || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications on navbar load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node
        )
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const getCurrentStock = (
    medicine: LowStockMedicine
  ) => {
    return (
      medicine.currentStock ??
      medicine.stock ??
      0
    );
  };

  const notificationCount =
    lowStockMedicines.length;

  const handleNotificationClick = () => {
    setNotificationsOpen(
      (current) => !current
    );

    if (!notificationsOpen) {
      fetchNotifications();
    }
  };

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
          {/* Search */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              type="button"
              onClick={handleNotificationClick}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-4 w-4" />

              {/* Notification Badge */}
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                  {notificationCount > 9
                    ? "9+"
                    : notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 top-11 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Low stock alerts
                    </p>
                  </div>

                  {notificationCount > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700">
                      {notificationCount} alert
                      {notificationCount !== 1
                        ? "s"
                        : ""}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-gray-500">
                        Loading notifications...
                      </p>
                    </div>
                  ) : notificationCount === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <Bell className="h-5 w-5" />
                      </div>

                      <p className="mt-3 text-sm font-medium text-gray-900">
                        No new notifications
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Your medicine stock looks good.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {lowStockMedicines.map(
                        (medicine) => {
                          const currentStock =
                            getCurrentStock(
                              medicine
                            );

                          const isOutOfStock =
                            currentStock <= 0;

                          return (
                            <div
                              key={medicine._id}
                              className="border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50"
                            >
                              <div className="flex gap-3">
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                    isOutOfStock
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {isOutOfStock ? (
                                    <PackageX className="h-4 w-4" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {medicine.name}
                                    </p>

                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                        isOutOfStock
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {isOutOfStock
                                        ? "OUT"
                                        : "LOW"}
                                    </span>
                                  </div>

                                  {medicine.genericName && (
                                    <p className="mt-0.5 truncate text-xs text-gray-500">
                                      {
                                        medicine.genericName
                                      }
                                    </p>
                                  )}

                                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                                    <span className="text-gray-500">
                                      Stock:
                                      <span
                                        className={`ml-1 font-semibold ${
                                          isOutOfStock
                                            ? "text-red-700"
                                            : "text-yellow-800"
                                        }`}
                                      >
                                        {currentStock}
                                      </span>
                                    </span>

                                    <span className="text-gray-500">
                                      Minimum:
                                      <span className="ml-1 font-semibold text-gray-900">
                                        {
                                          medicine.minimumStock
                                        }
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        "/notifications";
                    }}
                    className="w-full rounded-lg bg-black px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="ml-1 border-l pl-2 sm:ml-2 sm:pl-3">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

