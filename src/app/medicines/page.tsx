
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
  rack?: string;
  minimumStock: number;
  sellingPrice: number;
  purchasePrice: number;
  taxRate: number;
  isActive: boolean;
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/medicines");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch medicines");
      }

      setMedicines(data.medicines || []);
    } catch (error) {
      console.error("Fetch medicines error:", error);
      setError("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Open delete confirmation
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  // Close delete confirmation
  const handleCancelDelete = () => {
    if (deleting) return;

    setDeleteId(null);
    setDeleteName("");
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const response = await fetch(`/api/medicines/${deleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete medicine");
      }

      setMedicines((prev) =>
        prev.filter((medicine) => medicine._id !== deleteId)
      );

      setDeleteId(null);
      setDeleteName("");

      setToast({
        type: "success",
        message: `"${deleteName}" deleted successfully.`,
      });

      // Automatically hide toast
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error("Delete medicine error:", error);

      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete medicine",
      });

      setTimeout(() => {
        setToast(null);
      }, 3000);
    } finally {
      setDeleting(false);
    }
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const searchText = search.toLowerCase();

    return (
      medicine.name?.toLowerCase().includes(searchText) ||
      medicine.genericName?.toLowerCase().includes(searchText) ||
      medicine.company?.toLowerCase().includes(searchText) ||
      medicine.category?.toLowerCase().includes(searchText) ||
      medicine.rack?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Medicines
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your pharmacy medicines and inventory information.
            </p>
          </div>

          <Link
            href="/medicines/create"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Add Medicine
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Search by medicine name, generic name, company, category or rack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              Loading medicines...
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total medicines:{" "}
                <span className="font-semibold text-gray-900">
                  {filteredMedicines.length}
                </span>
              </p>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {filteredMedicines.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No medicines found
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {search
                      ? "Try a different search term."
                      : "Start by adding your first medicine."}
                  </p>

                  {!search && (
                    <Link
                      href="/medicines/create"
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      Add Medicine
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
                          Company
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Category
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Strength
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Rack
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-gray-700">
                          Purchase
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-gray-700">
                          Selling
                        </th>

                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredMedicines.map((medicine) => (
                        <tr
                          key={medicine._id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {medicine.name}
                              </p>

                              {medicine.genericName && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {medicine.genericName}
                                </p>
                              )}

                              {medicine.dosageForm && (
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {medicine.dosageForm}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {medicine.company || "-"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {medicine.category || "-"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {medicine.strength || "-"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {medicine.rack || "-"}
                          </td>

                          <td className="px-4 py-4 text-right text-gray-700">
                            ₹{medicine.purchasePrice.toFixed(2)}
                          </td>

                          <td className="px-4 py-4 text-right font-medium text-gray-900">
                            ₹{medicine.sellingPrice.toFixed(2)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/medicines/${medicine._id}/edit`}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteClick(
                                    medicine._id,
                                    medicine.name
                                  )
                                }
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Medicine?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  "{deleteName}"
                </span>
                ?
              </p>

              <p className="mt-1 text-xs text-gray-500">
                This medicine will be removed from the active medicine list.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-[60]">
          <div
            className={`min-w-[280px] rounded-lg border bg-white px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "border-gray-200"
                : "border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  toast.type === "success"
                    ? "bg-black text-white"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {toast.type === "success" ? "✓" : "!"}
              </div>

              <p
                className={`text-sm font-medium ${
                  toast.type === "success"
                    ? "text-gray-800"
                    : "text-red-700"
                }`}
              >
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

