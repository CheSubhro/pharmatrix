

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  strength?: string;
  dosageForm?: string;
  rack?: string;
  shelf?: string;
  minimumStock: number;
}

interface Batch {
  _id: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  initialStock: number;
  currentStock: number;
}

interface StockSummary {
  medicine: Medicine;
  totalStock: number;
  batchCount: number;
  stockStatus: "Good" | "Low Stock" | "Out of Stock";
  batches: Batch[];
}

interface Rack {
  _id: string;
  name: string;
  code: string;
  shelves: string[];
}

export default function StockSummaryPage() {
  const [stockSummary, setStockSummary] = useState<StockSummary[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedMedicine, setExpandedMedicine] = useState<string | null>(
    null
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [stockRes, rackRes] = await Promise.all([
        fetch("/api/stock-summary"),
        fetch("/api/racks"),
      ]);

      const stockData = await stockRes.json();
      const rackData = await rackRes.json();

      if (!stockRes.ok || !stockData.success) {
        throw new Error(
          stockData.message || "Failed to fetch stock summary"
        );
      }

      if (!rackRes.ok || !rackData.success) {
        throw new Error(rackData.message || "Failed to fetch racks");
      }

      setStockSummary(stockData.stockSummary || []);
      setRacks(rackData.racks || []);
    } catch (err) {
      console.error("Stock summary fetch error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load stock summary";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRackName = (rackId?: string) => {
    if (!rackId) return "-";

    const rack = racks.find((item) => item._id === rackId);

    if (!rack) return "-";

    return rack.code || rack.name;
  };

  const filteredStock = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return stockSummary;
    }

    return stockSummary.filter((item) => {
      const medicine = item.medicine;
      const rackName = getRackName(medicine.rack);

      return (
        medicine.name?.toLowerCase().includes(value) ||
        medicine.genericName?.toLowerCase().includes(value) ||
        medicine.company?.toLowerCase().includes(value) ||
        medicine.strength?.toLowerCase().includes(value) ||
        medicine.dosageForm?.toLowerCase().includes(value) ||
        rackName.toLowerCase().includes(value) ||
        medicine.shelf?.toLowerCase().includes(value) ||
        item.stockStatus.toLowerCase().includes(value)
      );
    });
  }, [search, stockSummary, racks]);

  const getStatusClass = (
    status: StockSummary["stockStatus"]
  ) => {
    if (status === "Good") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Low Stock") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-red-100 text-red-700";
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
      return {
        label: "Expired",
        className: "bg-red-100 text-red-700",
      };
    }

    const difference =
      expiry.getTime() - today.getTime();

    const days = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (days <= 90) {
      return {
        label: "Near Expiry",
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "Good",
      className: "bg-green-100 text-green-700",
    };
  };

  const formatDate = (date?: string) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toggleMedicine = (medicineId: string) => {
    setExpandedMedicine((current) =>
      current === medicineId ? null : medicineId
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Stock Summary
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Medicine-wise total stock and batch-wise stock details.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Search Medicine
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine, company, rack, shelf or status..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            Loading stock summary...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={fetchData}
              className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredStock.length === 0 && (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
              No medicines found.
            </div>
          )}

        {/* Main Table */}
        {!loading &&
          !error &&
          filteredStock.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">

                  <thead className="border-b bg-gray-100">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold text-gray-700">
                        Medicine
                      </th>

                      <th className="px-5 py-4 text-left font-semibold text-gray-700">
                        Rack
                      </th>

                      <th className="px-5 py-4 text-left font-semibold text-gray-700">
                        Shelf
                      </th>

                      <th className="px-5 py-4 text-center font-semibold text-gray-700">
                        Total Stock
                      </th>

                      <th className="px-5 py-4 text-center font-semibold text-gray-700">
                        Batches
                      </th>

                      <th className="px-5 py-4 text-center font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="px-5 py-4 text-center font-semibold text-gray-700">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredStock.map((item) => {
                      const medicine = item.medicine;
                      const medicineId = medicine._id;
                      const isExpanded =
                        expandedMedicine === medicineId;

                      return (
                        <React.Fragment key={medicineId}>
                          {/* Medicine Row */}
                          <tr className="hover:bg-gray-50">

                            <td className="px-5 py-4">
                              <div className="font-semibold text-gray-900">
                                {medicine.name}
                                {medicine.strength
                                  ? ` ${medicine.strength}`
                                  : ""}
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                {medicine.genericName || "-"}
                                {medicine.company
                                  ? ` • ${medicine.company}`
                                  : ""}
                              </div>

                              {medicine.dosageForm && (
                                <div className="mt-1 text-xs text-gray-400">
                                  {medicine.dosageForm}
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4 text-gray-700">
                              {getRackName(medicine.rack)}
                            </td>

                            <td className="px-5 py-4 text-gray-700">
                              {medicine.shelf || "-"}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="text-lg font-bold text-gray-900">
                                {item.totalStock}
                              </span>

                              <div className="text-xs text-gray-400">
                                Min: {medicine.minimumStock}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-center text-gray-700">
                              {item.batchCount}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                  item.stockStatus
                                )}`}
                              >
                                {item.stockStatus}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() =>
                                  toggleMedicine(medicineId)
                                }
                                className="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
                              >
                                {isExpanded
                                  ? "Hide"
                                  : "View Batches"}
                              </button>
                            </td>

                          </tr>

                          {/* Batch Details Row */}
                          {isExpanded && (
                            <tr>
                              <td
                                colSpan={7}
                                className="bg-gray-50 px-5 py-5"
                              >
                                <div className="rounded-lg border bg-white">

                                  <div className="border-b px-5 py-4">
                                    <h3 className="font-semibold text-gray-900">
                                      Batch-wise Stock
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {medicine.name}{" "}
                                      {medicine.strength || ""}
                                    </p>
                                  </div>

                                  {item.batches.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-500">
                                      No active batches available.
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">

                                      <table className="w-full min-w-[750px] text-sm">

                                        <thead className="border-b bg-gray-50">
                                          <tr>
                                            <th className="px-5 py-3 text-left font-medium text-gray-600">
                                              Batch
                                            </th>

                                            <th className="px-5 py-3 text-left font-medium text-gray-600">
                                              Manufacturing
                                            </th>

                                            <th className="px-5 py-3 text-left font-medium text-gray-600">
                                              Expiry
                                            </th>

                                            <th className="px-5 py-3 text-center font-medium text-gray-600">
                                              Initial Stock
                                            </th>

                                            <th className="px-5 py-3 text-center font-medium text-gray-600">
                                              Current Stock
                                            </th>

                                            <th className="px-5 py-3 text-center font-medium text-gray-600">
                                              Expiry Status
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody className="divide-y">
                                          {item.batches.map(
                                            (batch) => {
                                              const expiryStatus =
                                                getExpiryStatus(
                                                  batch.expiryDate
                                                );

                                              return (
                                                <tr
                                                  key={batch._id}
                                                  className="hover:bg-gray-50"
                                                >
                                                  <td className="px-5 py-4 font-medium text-gray-900">
                                                    {
                                                      batch.batchNumber
                                                    }
                                                  </td>

                                                  <td className="px-5 py-4 text-gray-600">
                                                    {formatDate(
                                                      batch.manufacturingDate
                                                    )}
                                                  </td>

                                                  <td className="px-5 py-4 text-gray-600">
                                                    {formatDate(
                                                      batch.expiryDate
                                                    )}
                                                  </td>

                                                  <td className="px-5 py-4 text-center text-gray-600">
                                                    {
                                                      batch.initialStock
                                                    }
                                                  </td>

                                                  <td className="px-5 py-4 text-center">
                                                    <span className="font-bold text-gray-900">
                                                      {
                                                        batch.currentStock
                                                      }
                                                    </span>
                                                  </td>

                                                  <td className="px-5 py-4 text-center">
                                                    <span
                                                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${expiryStatus.className}`}
                                                    >
                                                      {
                                                        expiryStatus.label
                                                      }
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            }
                                          )}
                                        </tbody>

                                      </table>
                                    </div>
                                  )}

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>

                </table>
              </div>
            </div>
          )}

      </div>
    </div>
  );
}

