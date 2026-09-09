

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ExpiryItem {
  _id: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  genericName?: string;
  category?: string;
  rack: string;
  shelf: string;
  supplier: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  stockValue: number;
  expiryDate: string;
  daysLeft: number;
  expiryStatus: "EXPIRED" | "NEAR_EXPIRY" | "GOOD";
}

interface ExpirySummary {
  totalBatches: number;
  expiredCount: number;
  nearExpiryCount: number;
  goodCount: number;
  expiredStock: number;
  nearExpiryStock: number;
  expiredStockValue: number;
  nearExpiryStockValue: number;
}

interface ExpiryResponse {
  success: boolean;
  summary: ExpirySummary;
  expiryReport: ExpiryItem[];
  message?: string;
}

export default function ExpiryReportPage() {
  const [expiryReport, setExpiryReport] = useState<
    ExpiryItem[]
  >([]);

  const [summary, setSummary] =
    useState<ExpirySummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  useEffect(() => {
    fetchExpiryReport();
  }, []);

  const fetchExpiryReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/reports/expiry?status=${statusFilter}`
      );

      const data: ExpiryResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load expiry report"
        );
      }

      setSummary(data.summary);
      setExpiryReport(data.expiryReport);
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load expiry report";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredReport = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    if (!searchText) {
      return expiryReport;
    }

    return expiryReport.filter((item) => {
      return (
        item.medicineName
          .toLowerCase()
          .includes(searchText) ||
        item.genericName
          ?.toLowerCase()
          .includes(searchText) ||
        item.batchNumber
          .toLowerCase()
          .includes(searchText) ||
        item.category
          ?.toLowerCase()
          .includes(searchText) ||
        item.rack
          .toLowerCase()
          .includes(searchText) ||
        item.shelf
          .toLowerCase()
          .includes(searchText) ||
        item.supplier
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [expiryReport, search]);

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusLabel = (
    status: ExpiryItem["expiryStatus"]
  ) => {
    if (status === "EXPIRED") {
      return "Expired";
    }

    if (status === "NEAR_EXPIRY") {
      return "Near Expiry";
    }

    return "Good";
  };

  const getStatusClass = (
    status: ExpiryItem["expiryStatus"]
  ) => {
    if (status === "EXPIRED") {
      return "bg-red-100 text-red-700";
    }

    if (status === "NEAR_EXPIRY") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  };

  const getDaysLeftClass = (daysLeft: number) => {
    if (daysLeft < 0) {
      return "font-bold text-red-600";
    }

    if (daysLeft <= 30) {
      return "font-semibold text-yellow-600";
    }

    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Expiry Report
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Monitor expired, near-expiry and valid
          medicine batches.
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Batches
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.totalBatches}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Expired
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {summary.expiredCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {summary.expiredStock} units
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Near Expiry
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-600">
              {summary.nearExpiryCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {summary.nearExpiryStock} units
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Good
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {summary.goodCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Risk Value
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(
                summary.expiredStockValue +
                  summary.nearExpiryStockValue
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Expired + Near Expiry
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search medicine, batch, rack, shelf or supplier..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="w-full md:w-56">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Expiry Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="EXPIRED">
                Expired
              </option>

              <option value="NEAR_EXPIRY">
                Near Expiry
              </option>

              <option value="GOOD">
                Good
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchExpiryReport}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Expiry Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredReport.length} of{" "}
            {expiryReport.length} batches
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Loading expiry report...
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchExpiryReport}
              className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredReport.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            No expiry records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Medicine
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Batch
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Expiry Date
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Days Left
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Stock
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Rack / Shelf
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Supplier
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Purchase
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Stock Value
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredReport.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {item.medicineName}
                      </div>

                      {item.genericName && (
                        <div className="mt-1 text-xs text-gray-500">
                          {item.genericName}
                        </div>
                      )}

                      {item.category && (
                        <div className="mt-1 text-xs text-gray-400">
                          {item.category}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-900">
                        {item.batchNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatDate(item.expiryDate)}
                    </td>

                    <td
                      className={`px-5 py-4 ${getDaysLeftClass(
                        item.daysLeft
                      )}`}
                    >
                      {item.daysLeft < 0
                        ? `${Math.abs(
                            item.daysLeft
                          )} days overdue`
                        : item.daysLeft === 0
                        ? "Expires today"
                        : `${item.daysLeft} days`}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span
                        className={
                          item.quantity <= 0
                            ? "font-bold text-red-600"
                            : "font-semibold text-gray-900"
                        }
                      >
                        {item.quantity}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {item.rack}
                      </div>

                      <div className="text-xs text-gray-500">
                        {item.shelf}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.supplier}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {formatCurrency(
                        item.purchasePrice
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(
                        item.stockValue
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          item.expiryStatus
                        )}`}
                      >
                        {getStatusLabel(
                          item.expiryStatus
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
