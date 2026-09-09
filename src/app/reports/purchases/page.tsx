

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Supplier {
  _id: string;
  supplierName: string;
  phone?: string;
  email?: string;
}

interface PurchaseItem {
  medicineName?: string;
  quantity?: number;
}

interface Purchase {
  _id: string;
  invoiceNumber?: string;
  purchaseDate: string;
  supplier?: Supplier;
  supplierName?: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: "PENDING" | "RECEIVED" | string;
}

interface Summary {
  totalInvoices: number;
  totalItems: number;
  totalPurchaseAmount: number;
  receivedInvoices: number;
  receivedAmount: number;
  pendingInvoices: number;
  pendingAmount: number;
}

interface SupplierSummary {
  supplierName: string;
  invoiceCount: number;
  totalAmount: number;
}

type Period =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export default function PurchaseReportPage() {
  const [period, setPeriod] =
    useState<Period>("DAILY");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [purchases, setPurchases] =
    useState<Purchase[]>([]);

  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [supplierSummary, setSupplierSummary] =
    useState<SupplierSummary[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      let url =
        `/api/reports/purchases?period=${period}`;

      if (period === "CUSTOM") {
        if (!from || !to) {
          setLoading(false);
          return;
        }

        url += `&from=${from}&to=${to}`;
      }

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load purchase report"
        );
      }

      setPurchases(data.purchases || []);
      setSummary(data.summary || null);
      setSupplierSummary(
        data.supplierSummary || []
      );
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load purchase report";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== "CUSTOM") {
      fetchReport();
    }
  }, [period]);

  const handleCustomSearch = () => {
    if (!from || !to) {
      toast.error(
        "Please select both from and to dates"
      );
      return;
    }

    if (from > to) {
      toast.error(
        "From date cannot be greater than to date"
      );
      return;
    }

    fetchReport();
  };

  const periodLabel = () => {
    if (period === "DAILY") return "Today";
    if (period === "WEEKLY")
      return "This Week";
    if (period === "MONTHLY")
      return "This Month";

    return "Custom Range";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Purchase Report
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View purchase activity, supplier-wise
          spending and received or pending
          purchases.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Report Period
            </label>

            <select
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value as Period
                )
              }
              className="w-48 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
            >
              <option value="DAILY">
                Daily
              </option>

              <option value="WEEKLY">
                Weekly
              </option>

              <option value="MONTHLY">
                Monthly
              </option>

              <option value="CUSTOM">
                Custom Range
              </option>
            </select>
          </div>

          {period === "CUSTOM" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  From
                </label>

                <input
                  type="date"
                  value={from}
                  onChange={(e) =>
                    setFrom(e.target.value)
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  To
                </label>

                <input
                  type="date"
                  value={to}
                  onChange={(e) =>
                    setTo(e.target.value)
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <button
                type="button"
                onClick={handleCustomSearch}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {periodLabel()} Purchases
        </h2>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading purchase report...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Invoices
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary?.totalInvoices || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Items Purchased
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary?.totalItems || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-900 bg-gray-900 p-5 shadow-sm">
              <p className="text-sm text-gray-300">
                Total Purchase
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {formatCurrency(
                  summary?.totalPurchaseAmount ||
                    0
                )}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Received
              </p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatCurrency(
                  summary?.receivedAmount || 0
                )}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {summary?.receivedInvoices || 0}{" "}
                invoice
                {summary?.receivedInvoices !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Pending
              </p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatCurrency(
                  summary?.pendingAmount || 0
                )}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {summary?.pendingInvoices || 0}{" "}
                invoice
                {summary?.pendingInvoices !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          {/* Supplier Summary */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Supplier-wise Purchase
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Suppliers ranked by total purchase
                amount.
              </p>
            </div>

            {supplierSummary.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No supplier purchase data found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-5 py-3 text-left font-semibold text-gray-700">
                        Supplier
                      </th>

                      <th className="px-5 py-3 text-center font-semibold text-gray-700">
                        Invoices
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-gray-700">
                        Total Purchase
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {supplierSummary.map(
                      (supplier, index) => (
                        <tr
                          key={`${supplier.supplierName}-${index}`}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 font-medium text-gray-900">
                            {supplier.supplierName}
                          </td>

                          <td className="px-5 py-4 text-center text-gray-700">
                            {supplier.invoiceCount}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-gray-900">
                            {formatCurrency(
                              supplier.totalAmount
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

          {/* Purchase Transactions */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Purchase Transactions
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {purchases.length} purchase
                {purchases.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            {purchases.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No purchases found for this
                period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-5 py-3 text-left font-semibold text-gray-700">
                        Date
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-gray-700">
                        Invoice
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-gray-700">
                        Supplier
                      </th>

                      <th className="px-5 py-3 text-center font-semibold text-gray-700">
                        Items
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-gray-700">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-center font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchases.map(
                      (purchase) => (
                        <tr
                          key={purchase._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                            {formatDate(
                              purchase.purchaseDate
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                            {purchase.invoiceNumber ||
                              purchase._id}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900">
                              {purchase.supplier
                                ?.supplierName ||
                                purchase.supplierName ||
                                "Unknown Supplier"}
                            </div>

                            {purchase.supplier
                              ?.phone && (
                              <div className="text-xs text-gray-500">
                                {
                                  purchase
                                    .supplier
                                    .phone
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center text-gray-700">
                            {(
                              purchase.items ||
                              []
                            ).reduce(
                              (
                                sum,
                                item
                              ) =>
                                sum +
                                Number(
                                  item.quantity ||
                                    0
                                ),
                              0
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-gray-900">
                            {formatCurrency(
                              purchase.totalAmount
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                purchase.status ===
                                "RECEIVED"
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {purchase.status}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

