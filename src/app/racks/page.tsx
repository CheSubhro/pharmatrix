

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface Rack {
  _id: string;
  name: string;
  code: string;
  shelves: string[];
  description?: string;
  isActive: boolean;
}

export default function RacksPage() {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRacks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/racks");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch racks");
      }

      setRacks(data.racks || []);
    } catch (error) {
      console.error("Fetch racks error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch racks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRacks();
  }, []);

  const deleteRack = async (id: string) => {
    try {
      const response = await fetch(`/api/racks/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete rack"
        );
      }

      setRacks((prev) =>
        prev.filter((rack) => rack._id !== id)
      );

      toast.success("Rack deleted successfully");
    } catch (error) {
      console.error("Delete rack error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete rack"
      );
    }
  };

  const handleDelete = (id: string, name: string) => {
    toast.warning(`Delete "${name}"?`, {
      description:
        "This rack will be removed from the active rack list.",
      duration: 5000,
      action: {
        label: "Delete",
        onClick: () => deleteRack(id),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const filteredRacks = racks.filter((rack) => {
    const searchText = search.toLowerCase();

    return (
      rack.name.toLowerCase().includes(searchText) ||
      rack.code.toLowerCase().includes(searchText) ||
      rack.shelves.some((shelf) =>
        shelf.toLowerCase().includes(searchText)
      )
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Rack / Shelf Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage medicine storage racks and shelves.
            </p>
          </div>

          <Link
            href="/racks/create"
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Add Rack
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by rack name, code or shelf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Content */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Loading racks...
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>

              <button
                type="button"
                onClick={fetchRacks}
                className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          ) : filteredRacks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                {search
                  ? "No racks found."
                  : "No racks available."}
              </p>

              {!search && (
                <Link
                  href="/racks/create"
                  className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Add Your First Rack
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Rack
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Code
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Shelves
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Description
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRacks.map((rack) => (
                    <tr
                      key={rack._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {rack.name}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {rack.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {rack.shelves.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {rack.shelves.map(
                              (shelf, index) => (
                                <span
                                  key={`${rack._id}-${index}`}
                                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
                                >
                                  {shelf}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No shelves
                          </span>
                        )}
                      </td>

                      <td className="max-w-xs px-6 py-4">
                        <p className="truncate text-sm text-gray-600">
                          {rack.description || "—"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/racks/${rack._id}/edit`}
                            className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                rack._id,
                                rack.name
                              )
                            }
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
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

        {/* Summary */}
        {!loading && !error && racks.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredRacks.length} of {racks.length} racks
          </div>
        )}
      </div>
    </div>
  );
}

