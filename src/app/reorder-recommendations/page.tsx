

"use client";

import { useEffect, useMemo, useState } from "react";

type Recommendation = {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
  rack?: string;
  shelf?: string;
  minimumStock: number;
  currentStock: number;
  targetStock: number;
  recommendedOrderQuantity: number;
  purchasePrice: number;
  estimatedPurchaseCost: number;
  status: "Out of Stock" | "Low Stock" | "Good";
};

type Rack = {
  _id: string;
  name: string;
  code: string;
};

type Summary = {
  totalRecommendations: number;
  totalRecommendedUnits: number;
  estimatedTotalPurchaseCost: number;
  outOfStockCount: number;
  lowStockCount: number;
};

export default function ReorderRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [summary, setSummary] = useState<Summary>({
    totalRecommendations: 0,
    totalRecommendedUnits: 0,
    estimatedTotalPurchaseCost: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
  });

  const [racks, setRacks] = useState<Rack[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------
  // Fetch recommendations
  // --------------------------------

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError("");

      const [recommendationResponse, rackResponse] =
        await Promise.all([
          fetch("/api/reorder-recommendations"),
          fetch("/api/racks"),
        ]);

      const recommendationData =
        await recommendationResponse.json();

      const rackData = await rackResponse.json();

      if (!recommendationResponse.ok) {
        throw new Error(
          recommendationData.message ||
            "Failed to fetch recommendations"
        );
      }

      setRecommendations(
        recommendationData.recommendations || []
      );

      setSummary(
        recommendationData.summary || {
          totalRecommendations: 0,
          totalRecommendedUnits: 0,
          estimatedTotalPurchaseCost: 0,
          outOfStockCount: 0,
          lowStockCount: 0,
        }
      );

      setRacks(rackData.racks || []);
    } catch (err) {
      console.error(
        "Reorder recommendation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load recommendations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // --------------------------------
  // Rack map
  // --------------------------------

  const rackMap = useMemo(() => {
    const map = new Map<string, string>();

    racks.forEach((rack) => {
      map.set(
        rack._id,
        `${rack.code} - ${rack.name}`
      );
    });

    return map;
  }, [racks]);

  // --------------------------------
  // Filter recommendations
  // --------------------------------

  const filteredRecommendations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recommendations.filter((medicine) => {
      const matchesSearch =
        !query ||
        medicine.name
          .toLowerCase()
          .includes(query) ||
        medicine.genericName
          ?.toLowerCase()
          .includes(query) ||
        medicine.company
          ?.toLowerCase()
          .includes(query) ||
        medicine.category
          ?.toLowerCase()
          .includes(query) ||
        medicine.strength
          ?.toLowerCase()
          .includes(query) ||
        medicine.dosageForm
          ?.toLowerCase()
          .includes(query) ||
        medicine.shelf
          ?.toLowerCase()
          .includes(query) ||
        rackMap
          .get(medicine.rack || "")
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        medicine.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    recommendations,
    search,
    statusFilter,
    rackMap,
  ]);

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <section className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading reorder recommendations...
            </p>
          </div>
        </section>
      </main>
    );
  }

  // --------------------------------
  // Error
  // --------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100">
        <section className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <p className="font-medium text-red-600">
              {error}
            </p>

            <button
              onClick={fetchRecommendations}
              className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}

      <header className="border-b bg-white px-8 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold text-gray-900">
            Reorder Recommendations
          </h1>

          <p className="text-xs text-gray-500">
            Medicines that need to be reordered
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-8">
        {/* Page Heading */}

        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Purchase Recommendation
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Recommended stock replenishment based on
            current inventory
          </p>
        </div>

        {/* Summary Cards */}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Recommendations */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Medicines to Reorder
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.totalRecommendations}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Medicines requiring purchase
            </p>
          </div>

          {/* Units */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Units
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.totalRecommendedUnits}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Recommended order quantity
            </p>
          </div>

          {/* Purchase Cost */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Estimated Purchase
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              ₹
              {summary.estimatedTotalPurchaseCost.toLocaleString(
                "en-IN"
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Estimated purchase cost
            </p>
          </div>

          {/* Out of Stock */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Out of Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.outOfStockCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Completely unavailable
            </p>
          </div>
        </div>

        {/* Filters */}

        <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search medicine, company, rack, shelf..."
                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>

            {/* Status */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-black"
              >
                <option value="All">All</option>
                <option value="Out of Stock">
                  Out of Stock
                </option>
                <option value="Low Stock">
                  Low Stock
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Recommendation Table */}

        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Reorder List
                </h3>

                <p className="text-sm text-gray-500">
                  {filteredRecommendations.length} medicines
                  shown
                </p>
              </div>
            </div>
          </div>

          {filteredRecommendations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">
                No reorder recommendations found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">
                      Medicine
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700">
                      Company
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700">
                      Strength
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700">
                      Rack
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700">
                      Shelf
                    </th>

                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                      Current
                    </th>

                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                      Minimum
                    </th>

                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                      Target
                    </th>

                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                      Order Qty
                    </th>

                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      Purchase Price
                    </th>

                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      Estimated Cost
                    </th>

                    <th className="px-6 py-4 text-center font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredRecommendations.map(
                    (medicine) => (
                      <tr
                        key={medicine._id}
                        className="hover:bg-gray-50"
                      >
                        {/* Medicine */}

                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {medicine.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {medicine.genericName ||
                              "—"}{" "}
                            •{" "}
                            {medicine.dosageForm ||
                              "—"}
                          </p>
                        </td>

                        {/* Company */}

                        <td className="px-6 py-4 text-gray-700">
                          {medicine.company || "—"}
                        </td>

                        {/* Strength */}

                        <td className="px-6 py-4 text-gray-700">
                          {medicine.strength || "—"}
                        </td>

                        {/* Rack */}

                        <td className="px-6 py-4 text-gray-700">
                          {rackMap.get(
                            medicine.rack || ""
                          ) || "—"}
                        </td>

                        {/* Shelf */}

                        <td className="px-6 py-4 text-gray-700">
                          {medicine.shelf || "—"}
                        </td>

                        {/* Current Stock */}

                        <td className="px-6 py-4 text-center font-medium text-gray-900">
                          {medicine.currentStock}
                        </td>

                        {/* Minimum */}

                        <td className="px-6 py-4 text-center text-gray-700">
                          {medicine.minimumStock}
                        </td>

                        {/* Target */}

                        <td className="px-6 py-4 text-center text-gray-700">
                          {medicine.targetStock}
                        </td>

                        {/* Order Quantity */}

                        <td className="px-6 py-4 text-center">
                          <span className="rounded-md bg-gray-100 px-3 py-1.5 font-bold text-gray-900">
                            {medicine.recommendedOrderQuantity}
                          </span>
                        </td>

                        {/* Purchase Price */}

                        <td className="px-6 py-4 text-right text-gray-700">
                          ₹
                          {medicine.purchasePrice.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        {/* Estimated Cost */}

                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          ₹
                          {medicine.estimatedPurchaseCost.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        {/* Status */}

                        <td className="px-6 py-4 text-center">
                          {medicine.status ===
                          "Out of Stock" ? (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                              Low Stock
                            </span>
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
      </section>
    </main>
  );
}

