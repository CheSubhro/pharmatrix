

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface StockMedicine {
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  rack: string;
  rackCode: string;
  shelf: string;
  currentStock: number;
  minimumStock: number;
  batchCount: number;
  stockValue: number;
  purchasePrice: number;
  sellingPrice: number;
  stockStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "GOOD";
}

interface StockSummary {
  totalMedicines: number;
  totalStock: number;
  totalStockValue: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  goodStockCount: number;
}

interface StockResponse {
  success: boolean;
  summary: StockSummary;
  stockReport: StockMedicine[];
  message?: string;
}

export default function StockReportPage() {
  const [stockReport, setStockReport] = useState<
    StockMedicine[]
  >([]);

  const [summary, setSummary] =
    useState<StockSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  useEffect(() => {
    fetchStockReport();
  }, []);

  const fetchStockReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/reports/stock"
      );

      const data: StockResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load stock report"
        );
      }

      setSummary(data.summary);
      setStockReport(data.stockReport);
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load stock report";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return stockReport.filter((medicine) => {
      const matchesSearch =
        !searchText ||
        medicine.name
          .toLowerCase()
          .includes(searchText) ||
        medicine.genericName
          ?.toLowerCase()
          .includes(searchText) ||
        medicine.category
          .toLowerCase()
          .includes(searchText) ||
        medicine.rack
          .toLowerCase()
          .includes(searchText) ||
        medicine.rackCode
          .toLowerCase()
          .includes(searchText) ||
        medicine.shelf
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        medicine.stockStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stockReport, search, statusFilter]);

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const getStatusLabel = (
    status: StockMedicine["stockStatus"]
  ) => {
    if (status === "OUT_OF_STOCK") {
      return "Out of Stock";
    }

    if (status === "LOW_STOCK") {
      return "Low Stock";
    }

    return "Good";
  };

  const getStatusClass = (
    status: StockMedicine["stockStatus"]
  ) => {
    if (status === "OUT_OF_STOCK") {
      return "bg-red-100 text-red-700";
    }

    if (status === "LOW_STOCK") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Stock Report
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View current medicine stock, stock value,
          rack location and stock status.
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Medicines
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.totalMedicines}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Stock
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.totalStock}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Stock Value
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(
                summary.totalStockValue
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              In Stock
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {summary.inStockCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Low Stock
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-600">
              {summary.lowStockCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Out of Stock
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {summary.outOfStockCount}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search Medicine
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search medicine, category, rack or shelf..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="w-full md:w-56">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Stock Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="GOOD">
                Good
              </option>

              <option value="LOW_STOCK">
                Low Stock
              </option>

              <option value="OUT_OF_STOCK">
                Out of Stock
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchStockReport}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Stock Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredStock.length} of{" "}
            {stockReport.length} medicines
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Loading stock report...
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchStockReport}
              className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            No medicines found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Medicine
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Category
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Rack / Shelf
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Current Stock
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Min Stock
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Batches
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Purchase
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Selling
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
                {filteredStock.map((medicine) => (
                  <tr
                    key={medicine._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {medicine.name}
                      </div>

                      {medicine.genericName && (
                        <div className="mt-1 text-xs text-gray-500">
                          {medicine.genericName}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {medicine.category}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {medicine.rack}
                      </div>

                      <div className="text-xs text-gray-500">
                        {medicine.rackCode} •{" "}
                        {medicine.shelf}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span
                        className={
                          medicine.currentStock <=
                          medicine.minimumStock
                            ? "font-bold text-red-600"
                            : "font-semibold text-gray-900"
                        }
                      >
                        {medicine.currentStock}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {medicine.minimumStock}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {medicine.batchCount}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {formatCurrency(
                        medicine.purchasePrice
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {formatCurrency(
                        medicine.sellingPrice
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(
                        medicine.stockValue
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          medicine.stockStatus
                        )}`}
                      >
                        {getStatusLabel(
                          medicine.stockStatus
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

