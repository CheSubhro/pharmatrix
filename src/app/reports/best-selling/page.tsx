

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Period = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

interface BestSellingMedicine {
  rank: number;
  medicineId?: string;
  medicineName: string;
  quantitySold: number;
  revenue: number;
}

interface ReportSummary {
  totalMedicinesSold: number;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface ReportResponse {
  success: boolean;
  message?: string;
  period?: Period;
  dateRange?: {
    from: string;
    to: string;
  };
  summary?: ReportSummary;
  bestSelling?: BestSellingMedicine[];
}

export default function BestSellingReportPage() {
  const [period, setPeriod] = useState<Period>("MONTHLY");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [report, setReport] = useState<ReportResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("period", period);
      params.set("limit", "100");

      if (period === "CUSTOM") {
        if (!from || !to) {
          setLoading(false);
          return;
        }

        params.set("from", from);
        params.set("to", to);
      }

      const response = await fetch(
        `/api/reports/best-selling?${params.toString()}`
      );

      const data: ReportResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch best-selling report"
        );
      }

      setReport(data);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load report";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== "CUSTOM") {
      fetchReport();
    }
  }, [period]);

  const handleCustomApply = () => {
    if (!from || !to) {
      toast.error("Please select both From and To dates");
      return;
    }

    if (from > to) {
      toast.error("From date cannot be after To date");
      return;
    }

    fetchReport();
  };

  const filteredMedicines = useMemo(() => {
    const medicines = report?.bestSelling || [];
    const query = search.trim().toLowerCase();

    if (!query) {
      return medicines;
    }

    return medicines.filter((medicine) =>
      medicine.medicineName
        .toLowerCase()
        .includes(query)
    );
  }, [report, search]);

  const summary = report?.summary;

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  const formatPeriod = () => {
    if (period === "DAILY") return "Today";
    if (period === "WEEKLY") return "This Week";
    if (period === "MONTHLY") return "This Month";
    return "Custom Range";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Best-selling Medicines
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            See which medicines are selling the most.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReport}
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Period */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Period
            </label>

            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as Period)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* From */}
          {period === "CUSTOM" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  From
                </label>

                <input
                  type="date"
                  value={from}
                  onChange={(e) =>
                    setFrom(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              {/* To */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  To
                </label>

                <input
                  type="date"
                  value={to}
                  onChange={(e) =>
                    setTo(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCustomApply}
                  className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-500">
            Showing:{" "}
            <span className="font-medium text-gray-900">
              {formatPeriod()}
            </span>
          </div>

          <div className="w-full md:max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search medicine..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading best-selling report...
          </p>
        </div>
      ) : error ? (
        /* Error */
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchReport}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Medicines */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">
                Medicines Sold
              </div>

              <div className="mt-2 text-2xl font-bold text-gray-900">
                {summary?.totalMedicinesSold || 0}
              </div>

              <div className="mt-1 text-xs text-gray-400">
                Unique medicines
              </div>
            </div>

            {/* Quantity */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">
                Total Quantity Sold
              </div>

              <div className="mt-2 text-2xl font-bold text-gray-900">
                {summary?.totalQuantitySold || 0}
              </div>

              <div className="mt-1 text-xs text-gray-400">
                Units sold
              </div>
            </div>

            {/* Revenue */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">
                Total Revenue
              </div>

              <div className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(
                  summary?.totalRevenue || 0
                )}
              </div>

              <div className="mt-1 text-xs text-gray-400">
                From completed sales
              </div>
            </div>
          </div>

          {/* Best-selling Table */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Medicine Ranking
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Medicines ranked by quantity sold.
              </p>
            </div>

            {filteredMedicines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                <p className="text-sm text-gray-500">
                  No best-selling medicines found.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Try another period or search.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-3">
                        Rank
                      </th>

                      <th className="px-3 py-3">
                        Medicine
                      </th>

                      <th className="px-3 py-3">
                        Quantity Sold
                      </th>

                      <th className="px-3 py-3">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMedicines.map(
                      (medicine) => (
                        <tr
                          key={
                            medicine.medicineId ||
                            `${medicine.rank}-${medicine.medicineName}`
                          }
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                        >
                          {/* Rank */}
                          <td className="px-3 py-4">
                            {medicine.rank <= 3 ? (
                              <span
                                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold ${
                                  medicine.rank === 1
                                    ? "bg-yellow-100 text-yellow-800"
                                    : medicine.rank === 2
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                #{medicine.rank}
                              </span>
                            ) : (
                              <span className="font-medium text-gray-500">
                                #{medicine.rank}
                              </span>
                            )}
                          </td>

                          {/* Medicine */}
                          <td className="px-3 py-4">
                            <div className="font-semibold text-gray-900">
                              {medicine.medicineName}
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="px-3 py-4">
                            <span className="font-semibold text-gray-900">
                              {medicine.quantitySold}
                            </span>

                            <span className="ml-1 text-xs text-gray-500">
                              units
                            </span>
                          </td>

                          {/* Revenue */}
                          <td className="px-3 py-4 font-semibold text-gray-900">
                            {formatCurrency(
                              medicine.revenue
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

