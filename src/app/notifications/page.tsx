

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Boxes,
  RefreshCcw,
} from "lucide-react";

interface LowStockMedicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  currentStock?: number;
  stock?: number;
  minimumStock: number;
}

interface DashboardResponse {
  success: boolean;
  message?: string;

  dashboard?: {
    lowStockCount?: number;
    lowStockMedicines?: LowStockMedicine[];
  };
}

export default function NotificationsPage() {
  const [medicines, setMedicines] = useState<
    LowStockMedicine[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

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
            "Failed to load notifications"
        );
      }

      setMedicines(
        data.dashboard?.lowStockMedicines ||
          []
      );
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load notifications";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getStock = (
    medicine: LowStockMedicine
  ) => {
    return (
      medicine.currentStock ??
      medicine.stock ??
      0
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Important alerts that need your
            attention.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchNotifications}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Low Stock Alerts
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {medicines.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <Boxes className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Medicines Needing Attention
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {medicines.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-gray-500">
              Alert Type
            </p>

            <p className="mt-2 text-lg font-bold text-gray-900">
              Low Stock
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Based on minimum stock level
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading notifications...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchNotifications}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      ) : medicines.length === 0 ? (
        /* No Alerts */
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Boxes className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No Low Stock Alerts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            All medicines currently have
            sufficient stock.
          </p>
        </div>
      ) : (
        /* Alerts */
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Low Stock Alerts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These medicines are at or below
              their minimum stock level.
            </p>
          </div>

          <div className="space-y-3">
            {medicines.map((medicine) => {
              const currentStock =
                getStock(medicine);

              const isOutOfStock =
                currentStock <= 0;

              return (
                <div
                  key={medicine._id}
                  className="flex flex-col gap-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  {/* Medicine */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isOutOfStock
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {medicine.name}
                      </h3>

                      {medicine.genericName && (
                        <p className="text-xs text-gray-500">
                          {
                            medicine.genericName
                          }
                        </p>
                      )}

                      {medicine.company && (
                        <p className="mt-1 text-xs text-gray-400">
                          {medicine.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="grid grid-cols-2 gap-6 text-sm md:flex md:items-center">
                    <div>
                      <p className="text-xs text-gray-500">
                        Current Stock
                      </p>

                      <p
                        className={`mt-1 font-bold ${
                          isOutOfStock
                            ? "text-red-700"
                            : "text-yellow-800"
                        }`}
                      >
                        {currentStock}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Minimum Stock
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {
                          medicine.minimumStock
                        }
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          isOutOfStock
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {isOutOfStock
                          ? "OUT OF STOCK"
                          : "LOW STOCK"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

