

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/categories");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch categories");
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete category");
      }

      setCategories((prev) =>
        prev.filter((category) => category._id !== id)
      );
    } catch (error) {
      console.error("Delete category error:", error);
      alert("Failed to delete category");
    }
  };

  const filteredCategories = categories.filter((category) => {
    const searchText = search.toLowerCase();

    return (
      category.name?.toLowerCase().includes(searchText) ||
      category.description?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Categories
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage medicine categories for your pharmacy.
            </p>
          </div>

          <Link
            href="/categories/create"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Add Category
          </Link>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Search by category name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading categories...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total categories:{" "}
                <span className="font-semibold text-gray-900">
                  {filteredCategories.length}
                </span>
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {filteredCategories.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No categories found
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {search
                      ? "Try a different search term."
                      : "Start by adding your first category."}
                  </p>

                  {!search && (
                    <Link
                      href="/categories/create"
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      Add Category
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Category
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Description
                        </th>

                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredCategories.map((category) => (
                        <tr
                          key={category._id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">
                              {category.name}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {category.description || "-"}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/categories/${category._id}/edit`}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                Edit
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    category._id,
                                    category.name
                                  )
                                }
                                className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"
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

