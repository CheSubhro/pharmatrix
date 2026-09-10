
"use client";

import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Menu,
  PackageX,
  Search,
  Stethoscope,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import UserMenu from "@/components/auth/UserMenu";

interface NavbarProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;

  type:
    | "LOW_STOCK"
    | "EXPIRY_ALERT"
    | "DOCTOR_VISIT";

  title: string;
  message: string;

  medicineId?: string;
  medicineName?: string;
  genericName?: string;
  company?: string;

  currentStock?: number;
  minimumStock?: number;

  batchId?: string;
  batchNumber?: string;
  stock?: number;

  expiryDate?: string;
  daysLeft?: number;

  doctorId?: string;
  doctorName?: string;
  specialization?: string;

  startTime?: string;
  endTime?: string;
  chamber?: string;
  dayOfWeek?: string;

  severity:
    | "HIGH"
    | "MEDIUM"
    | "LOW";
}

interface NotificationsResponse {
  success: boolean;
  message?: string;

  notifications?: Notification[];

  summary?: {
    total: number;
    lowStock: number;
    expiry: number;
    doctorVisits: number;
  };
}

export default function Navbar({
  onMenuClick,
}: NavbarProps) {
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  /*
   * =========================================================
   * FETCH NOTIFICATIONS
   * =========================================================
   */

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const response = await fetch(
        "/api/notifications",
        {
          cache: "no-store",
        }
      );

      const data: NotificationsResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch notifications"
        );
      }

      setNotifications(
        data.notifications || []
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

  /*
   * Initial fetch
   */

  useEffect(() => {
    fetchNotifications();
  }, []);

  /*
   * =========================================================
   * OUTSIDE CLICK
   * =========================================================
   */

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

  /*
   * =========================================================
   * BELL CLICK
   * =========================================================
   */

  const handleNotificationClick = () => {
    const nextState =
      !notificationsOpen;

    setNotificationsOpen(nextState);

    if (nextState) {
      fetchNotifications();
    }
  };

  /*
   * =========================================================
   * EXPIRY TEXT
   * =========================================================
   */

  const getExpiryText = (
    daysLeft?: number
  ) => {
    if (
      daysLeft === undefined ||
      daysLeft === null
    ) {
      return "";
    }

    if (daysLeft < 0) {
      const days = Math.abs(daysLeft);

      return `Expired ${days} day${
        days !== 1 ? "s" : ""
      } ago`;
    }

    if (daysLeft === 0) {
      return "Expires today";
    }

    return `Expires in ${daysLeft} day${
      daysLeft !== 1 ? "s" : ""
    }`;
  };

  /*
   * =========================================================
   * TIME FORMAT
   * =========================================================
   */

  const formatTime = (
    time?: string
  ) => {
    if (!time) {
      return "";
    }

    const [hours, minutes] =
      time.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const date = new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  /*
   * =========================================================
   * COUNT
   * =========================================================
   */

  const notificationCount =
    notifications.length;

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b bg-white md:left-64">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* LEFT */}
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

        {/* RIGHT */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              type="button"
              onClick={
                handleNotificationClick
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
              aria-expanded={
                notificationsOpen
              }
            >
              <Bell className="h-4 w-4" />

              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                  {notificationCount > 9
                    ? "9+"
                    : notificationCount}
                </span>
              )}
            </button>

            {/* =================================================
                DROPDOWN
            ================================================= */}

            {notificationsOpen && (
              <div className="absolute right-0 top-11 w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Important alerts
                    </p>
                  </div>

                  {notificationCount >
                    0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700">
                      {notificationCount} alert
                      {notificationCount !==
                      1
                        ? "s"
                        : ""}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-xs text-gray-500">
                        Loading notifications...
                      </p>
                    </div>
                  ) : notificationCount ===
                    0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <Bell className="h-5 w-5" />
                      </div>

                      <p className="mt-3 text-sm font-medium text-gray-900">
                        No new notifications
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Your pharmacy has no
                        important alerts.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {notifications.map(
                        (notification) => {
                          const isLowStock =
                            notification.type ===
                            "LOW_STOCK";

                          const isExpiry =
                            notification.type ===
                            "EXPIRY_ALERT";

                          const isDoctorVisit =
                            notification.type ===
                            "DOCTOR_VISIT";

                          const isExpired =
                            isExpiry &&
                            (notification.daysLeft ??
                              0) < 0;

                          const isOutOfStock =
                            isLowStock &&
                            (notification.currentStock ??
                              0) <= 0;

                          return (
                            <div
                              key={
                                notification.id
                              }
                              className="border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50"
                            >
                              <div className="flex gap-3">
                                {/* ICON */}
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                    isExpired ||
                                    isOutOfStock
                                      ? "bg-red-100 text-red-700"
                                      : isDoctorVisit
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {isLowStock ? (
                                    <PackageX className="h-4 w-4" />
                                  ) : isDoctorVisit ? (
                                    <Stethoscope className="h-4 w-4" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4" />
                                  )}
                                </div>

                                {/* CONTENT */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {
                                        notification.title
                                      }
                                    </p>

                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                        isExpired ||
                                        isOutOfStock
                                          ? "bg-red-100 text-red-700"
                                          : isDoctorVisit
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {isOutOfStock
                                        ? "OUT"
                                        : isLowStock
                                        ? "LOW"
                                        : isExpired
                                        ? "EXPIRED"
                                        : isDoctorVisit
                                        ? "VISIT"
                                        : "EXPIRY"}
                                    </span>
                                  </div>

                                  {/* MESSAGE */}
                                  <p className="mt-1 text-xs text-gray-600">
                                    {
                                      notification.message
                                    }
                                  </p>

                                  {/* =================================================
                                      LOW STOCK
                                  ================================================= */}

                                  {isLowStock && (
                                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                                      <span className="text-gray-500">
                                        Stock:
                                        <span
                                          className={`ml-1 font-semibold ${
                                            (notification.currentStock ??
                                              0) <=
                                            0
                                              ? "text-red-700"
                                              : "text-yellow-800"
                                          }`}
                                        >
                                          {
                                            notification.currentStock
                                          }
                                        </span>
                                      </span>

                                      <span className="text-gray-500">
                                        Minimum:
                                        <span className="ml-1 font-semibold text-gray-900">
                                          {
                                            notification.minimumStock
                                          }
                                        </span>
                                      </span>
                                    </div>
                                  )}

                                  {/* =================================================
                                      EXPIRY
                                  ================================================= */}

                                  {isExpiry && (
                                    <div className="mt-2 space-y-1">
                                      {notification.batchNumber && (
                                        <p className="text-[11px] text-gray-500">
                                          Batch:
                                          <span className="ml-1 font-medium text-gray-700">
                                            {
                                              notification.batchNumber
                                            }
                                          </span>
                                        </p>
                                      )}

                                      <div className="flex items-center gap-3 text-[11px]">
                                        <span
                                          className={
                                            isExpired
                                              ? "font-semibold text-red-700"
                                              : "font-semibold text-yellow-800"
                                          }
                                        >
                                          {getExpiryText(
                                            notification.daysLeft
                                          )}
                                        </span>

                                        <span className="text-gray-500">
                                          Stock:
                                          <span className="ml-1 font-semibold text-gray-900">
                                            {
                                              notification.stock
                                            }
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* =================================================
                                      DOCTOR VISIT
                                  ================================================= */}

                                  {isDoctorVisit && (
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                                        <CalendarDays className="h-3.5 w-3.5" />

                                        <span className="font-medium text-gray-800">
                                          Today
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-gray-500">
                                        Time:
                                        <span className="ml-1 font-semibold text-gray-800">
                                          {formatTime(
                                            notification.startTime
                                          )}{" "}
                                          -
                                          {" "}
                                          {formatTime(
                                            notification.endTime
                                          )}
                                        </span>
                                      </div>

                                      {notification.specialization && (
                                        <div className="text-[11px] text-gray-500">
                                          Specialization:
                                          <span className="ml-1 font-medium text-gray-700">
                                            {
                                              notification.specialization
                                            }
                                          </span>
                                        </div>
                                      )}

                                      {notification.chamber && (
                                        <div className="text-[11px] text-gray-500">
                                          Chamber:
                                          <span className="ml-1 font-medium text-gray-700">
                                            {
                                              notification.chamber
                                            }
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* FOOTER */}
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

