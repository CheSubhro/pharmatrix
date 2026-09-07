

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

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/medicines/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete medicine");
      }

      setMedicines((prev) =>
        prev.filter((medicine) => medicine._id !== id)
      );
    } catch (error) {
      console.error("Delete medicine error:", error);
      alert("Failed to delete medicine");
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                      className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
                                  handleDelete(
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
    </div>
  );
}

