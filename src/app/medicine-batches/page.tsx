

"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  strength?: string;
  dosageForm?: string;
}

interface MedicineBatch {
  _id: string;
  medicine: Medicine;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  initialStock: number;
  currentStock: number;
  isActive: boolean;
}

export default function MedicineBatchesPage() {
  const [batches, setBatches] = useState<
    MedicineBatch[]
  >([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/medicine-batches"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch medicine batches"
        );
      }

      setBatches(data.batches || []);
    } catch (error) {
      console.error(
        "Fetch batches error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load medicine batches"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const getExpiryStatus = (
    expiryDate: string
  ) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);

    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
      return {
        label: "Expired",
        className:
          "bg-red-100 text-red-700",
      };
    }

    const difference =
      expiry.getTime() - today.getTime();

    const daysRemaining = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 90) {
      return {
        label: "Near Expiry",
        className:
          "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "Good",
      className:
        "bg-green-100 text-green-700",
    };
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const deleteBatch = async (
    id: string
  ) => {
    try {
      const response = await fetch(
        `/api/medicine-batches/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete medicine batch"
        );
      }

      setBatches((prev) =>
        prev.filter(
          (batch) => batch._id !== id
        )
      );

      toast.success(
        "Medicine batch deleted successfully"
      );
    } catch (error) {
      console.error(
        "Delete batch error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete medicine batch"
      );
    }
  };

  const handleDelete = (
    id: string,
    batchNumber: string
  ) => {
    toast.warning(
      `Delete batch "${batchNumber}"?`,
      {
        description:
          "This batch will be removed from the active batch list.",
        duration: 5000,

        action: {
          label: "Delete",
          onClick: () =>
            deleteBatch(id),
        },

        cancel: {
          label: "Cancel",
          onClick: () => {},
        },
      }
    );
  };

  const filteredBatches =
    batches.filter((batch) => {
      const searchText =
        search.toLowerCase();

      const medicineName =
        batch.medicine?.name?.toLowerCase() ||
        "";

      const genericName =
        batch.medicine?.genericName?.toLowerCase() ||
        "";

      const company =
        batch.medicine?.company?.toLowerCase() ||
        "";

      const batchNumber =
        batch.batchNumber?.toLowerCase() ||
        "";

      return (
        medicineName.includes(searchText) ||
        genericName.includes(searchText) ||
        company.includes(searchText) ||
        batchNumber.includes(searchText)
      );
    });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Medicine Batches
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage medicine batches, stock and
              expiry information.
            </p>
          </div>

          <Link
            href="/medicine-batches/create"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Add Batch
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Search by medicine, generic name, company or batch number..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading medicine batches...
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total batches:{" "}
                <span className="font-semibold text-gray-900">
                  {filteredBatches.length}
                </span>
              </p>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {filteredBatches.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No medicine batches found
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {search
                      ? "Try a different search term."
                      : "Start by adding your first medicine batch."}
                  </p>

                  {!search && (
                    <Link
                      href="/medicine-batches/create"
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      Add Batch
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Medicine
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Batch Number
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Manufacturing
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Expiry
                        </th>

                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-gray-700">
                          Initial Stock
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-gray-700">
                          Current Stock
                        </th>

                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredBatches.map(
                        (batch) => {
                          const expiryStatus =
                            getExpiryStatus(
                              batch.expiryDate
                            );

                          return (
                            <tr
                              key={batch._id}
                              className="transition hover:bg-gray-50"
                            >
                              {/* Medicine */}
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {
                                      batch.medicine
                                        ?.name
                                    }
                                  </p>

                                  {batch.medicine
                                    ?.genericName && (
                                    <p className="mt-0.5 text-xs text-gray-500">
                                      {
                                        batch
                                          .medicine
                                          .genericName
                                      }
                                    </p>
                                  )}

                                  {batch.medicine
                                    ?.strength && (
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      {
                                        batch
                                          .medicine
                                          .strength
                                      }
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Batch Number */}
                              <td className="px-4 py-4 font-medium text-gray-700">
                                {batch.batchNumber}
                              </td>

                              {/* Manufacturing */}
                              <td className="px-4 py-4 text-gray-600">
                                {formatDate(
                                  batch.manufacturingDate
                                )}
                              </td>

                              {/* Expiry */}
                              <td className="px-4 py-4 text-gray-600">
                                {formatDate(
                                  batch.expiryDate
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-4 py-4 text-center">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${expiryStatus.className}`}
                                >
                                  {
                                    expiryStatus.label
                                  }
                                </span>
                              </td>

                              {/* Initial Stock */}
                              <td className="px-4 py-4 text-right text-gray-700">
                                {
                                  batch.initialStock
                                }
                              </td>

                              {/* Current Stock */}
                              <td className="px-4 py-4 text-right font-semibold text-gray-900">
                                {
                                  batch.currentStock
                                }
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Link
                                    href={`/medicine-batches/${batch._id}/edit`}
                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                  >
                                    Edit
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete(
                                        batch._id,
                                        batch.batchNumber
                                      )
                                    }
                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
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
          </>
        )}
      </div>
    </div>
  );
}

