

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type ExpiryStatus = "EXPIRED" | "NEAR_EXPIRY" | "GOOD";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
  rack?: string;
  shelf?: string;
  minimumStock?: number;
}

interface ExpiryBatch {
  _id: string;
  medicine: Medicine;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  initialStock: number;
  currentStock: number;
  isActive: boolean;
  status: ExpiryStatus;
  daysLeft: number;
}

interface Summary {
  totalBatches: number;
  expiredCount: number;
  nearExpiryCount: number;
  goodCount: number;
  expiredStock: number;
  nearExpiryStock: number;
}

interface Rack {
  _id: string;
  name: string;
  code: string;
  shelves: string[];
}

export default function ExpiryManagementPage() {
  const [batches, setBatches] = useState<ExpiryBatch[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalBatches: 0,
    expiredCount: 0,
    nearExpiryCount: 0,
    goodCount: 0,
    expiredStock: 0,
    nearExpiryStock: 0,
  });

  const [racks, setRacks] = useState<Rack[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | ExpiryStatus
  >("ALL");

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [expiryResponse, rackResponse] = await Promise.all([
        fetch("/api/expiry-management"),
        fetch("/api/racks"),
      ]);

      const expiryData = await expiryResponse.json();
      const rackData = await rackResponse.json();

      if (!expiryResponse.ok || !expiryData.success) {
        throw new Error(
          expiryData.message || "Failed to fetch expiry data"
        );
      }

      setBatches(expiryData.batches || []);
      setSummary(
        expiryData.summary || {
          totalBatches: 0,
          expiredCount: 0,
          nearExpiryCount: 0,
          goodCount: 0,
          expiredStock: 0,
          nearExpiryStock: 0,
        }
      );

      if (rackResponse.ok && rackData.success) {
        setRacks(rackData.racks || []);
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load expiry management"
      );
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

    if (!rack) return rackId;

    return `${rack.code} - ${rack.name}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return batches.filter((batch) => {
      if (
        statusFilter !== "ALL" &&
        batch.status !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const medicine = batch.medicine || {};

      const searchableText = [
        medicine.name,
        medicine.genericName,
        medicine.company,
        medicine.category,
        medicine.strength,
        medicine.dosageForm,
        medicine.rack,
        medicine.shelf,
        batch.batchNumber,
        batch.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [batches, search, statusFilter]);

  const getStatusBadge = (status: ExpiryStatus) => {
    if (status === "EXPIRED") {
      return (
        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Expired
        </span>
      );
    }

    if (status === "NEAR_EXPIRY") {
      return (
        <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          Near Expiry
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Good
      </span>
    );
  };

  const getDaysText = (batch: ExpiryBatch) => {
    if (batch.status === "EXPIRED") {
      const days = Math.abs(batch.daysLeft);

      return `${days} day${days === 1 ? "" : "s"} overdue`;
    }

    if (batch.status === "NEAR_EXPIRY") {
      return `${batch.daysLeft} day${
        batch.daysLeft === 1 ? "" : "s"
      } left`;
    }

    return `${batch.daysLeft} days left`;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Expiry Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor expired and near-expiry medicine batches.
            </p>
          </div>

          <Link
            href="/medicine-batches"
            className="inline-flex w-fit items-center rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            View All Batches
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Batches
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.totalBatches}
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-600">
              Expired Batches
            </p>

            <p className="mt-2 text-3xl font-bold text-red-700">
              {summary.expiredCount}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Stock: {summary.expiredStock}
            </p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-orange-600">
              Near Expiry
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-700">
              {summary.nearExpiryCount}
            </p>

            <p className="mt-1 text-xs text-orange-600">
              Stock: {summary.nearExpiryStock}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-green-600">
              Good Batches
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {summary.goodCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-xl">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine, batch, company, rack, shelf..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === "ALL"
                    ? "bg-black text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("EXPIRED")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === "EXPIRED"
                    ? "bg-red-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Expired
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("NEAR_EXPIRY")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === "NEAR_EXPIRY"
                    ? "bg-orange-500 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Near Expiry
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("GOOD")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === "GOOD"
                    ? "bg-green-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Good
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Medicine
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Batch
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Rack
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Shelf
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Current Stock
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Expiry Date
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Days
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      Loading expiry data...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >
                      <p className="font-semibold text-gray-700">
                        No batches found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr
                      key={batch._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {batch.medicine?.name || "-"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {[
                              batch.medicine?.genericName,
                              batch.medicine?.strength,
                              batch.medicine?.dosageForm,
                            ]
                              .filter(Boolean)
                              .join(" • ") || "-"}
                          </p>

                          {batch.medicine?.company && (
                            <p className="mt-1 text-xs text-gray-400">
                              {batch.medicine.company}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-800">
                        {batch.batchNumber}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {getRackName(batch.medicine?.rack)}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {batch.medicine?.shelf || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900">
                          {batch.currentStock}
                        </span>

                        <span className="ml-1 text-xs text-gray-400">
                          units
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {formatDate(batch.expiryDate)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${
                            batch.status === "EXPIRED"
                              ? "text-red-600"
                              : batch.status === "NEAR_EXPIRY"
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {getDaysText(batch)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(batch.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredBatches.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredBatches.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {batches.length}
              </span>{" "}
              batches
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

