

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  strength?: string;
  dosageForm?: string;
}

interface PurchaseItem {
  medicine: Medicine;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  supplierName: string;
  supplierPhone?: string;
  invoiceNumber?: string;
  purchaseDate: string;
  status: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  note?: string;
}

export default function PurchasesPage() {
  const router = useRouter();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/purchases");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch purchases"
        );
      }

      setPurchases(data.purchases || []);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || "Failed to load purchases"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const matchesSearch =
        !query ||
        purchase.purchaseNumber
          .toLowerCase()
          .includes(query) ||
        purchase.supplierName
          .toLowerCase()
          .includes(query) ||
        purchase.invoiceNumber
          ?.toLowerCase()
          .includes(query) ||
        purchase.items.some((item) =>
          item.medicine?.name
            ?.toLowerCase()
            .includes(query)
        ) ||
        purchase.items.some((item) =>
          item.batchNumber
            ?.toLowerCase()
            .includes(query)
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        purchase.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  const totalPurchaseValue = purchases.reduce(
    (sum, purchase) => sum + purchase.grandTotal,
    0
  );

  const orderedCount = purchases.filter(
    (purchase) => purchase.status === "ORDERED"
  ).length;

  const receivedCount = purchases.filter(
    (purchase) => purchase.status === "RECEIVED"
  ).length;

  const draftCount = purchases.filter(
    (purchase) => purchase.status === "DRAFT"
  ).length;

  const getStatusClass = (status: Purchase["status"]) => {
    switch (status) {
      case "RECEIVED":
        return "bg-green-100 text-green-700";
      case "ORDERED":
        return "bg-blue-100 text-blue-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: Purchase["status"]) => {
    switch (status) {
      case "RECEIVED":
        return "Received";
      case "ORDERED":
        return "Ordered";
      case "CANCELLED":
        return "Cancelled";
      default:
        return "Draft";
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchases
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage purchase orders and purchase history.
            </p>
          </div>

          <button
            onClick={() => router.push("/purchases/create")}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Create Purchase
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Purchases
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {purchases.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Ordered
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {orderedCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Received
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {receivedCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Purchase Value
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              ₹{totalPurchaseValue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search purchase number, supplier, invoice, medicine or batch..."
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ORDERED">Ordered</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchase Table */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Purchase
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Supplier
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Invoice
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Items
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-gray-500"
                    >
                      Loading purchases...
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >
                      <p className="text-sm font-medium text-gray-700">
                        No purchases found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Create a purchase order to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {purchase.purchaseNumber}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {purchase.items.length} medicine
                          {purchase.items.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {purchase.supplierName}
                        </p>

                        {purchase.supplierPhone && (
                          <p className="mt-1 text-xs text-gray-500">
                            {purchase.supplierPhone}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {purchase.invoiceNumber || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {formatDate(purchase.purchaseDate)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[280px] space-y-1">
                          {purchase.items
                            .slice(0, 2)
                            .map((item, index) => (
                              <p
                                key={index}
                                className="truncate text-sm text-gray-700"
                              >
                                {item.medicine?.name ||
                                  "Unknown Medicine"}{" "}
                                × {item.quantity}
                              </p>
                            ))}

                          {purchase.items.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{purchase.items.length - 2} more
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <p className="font-semibold text-gray-900">
                          ₹{purchase.grandTotal.toFixed(2)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            purchase.status
                          )}`}
                        >
                          {getStatusLabel(purchase.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            router.push(
                              `/purchases/${purchase._id}`
                            )
                          }
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Info */}
        {!loading && purchases.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredPurchases.length} of{" "}
              {purchases.length} purchases
            </span>

            <span>
              Draft Purchases: {draftCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
