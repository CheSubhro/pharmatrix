

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Customer {
  _id: string;
  customerName: string;
  phone?: string;
}

interface SaleItem {
  medicineName: string;
  quantity: number;
  sellingPrice: number;
  total: number;
}

interface Sale {
  _id: string;
  billNumber: string;
  customer?: Customer;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
  paymentStatus: string;
  saleDate: string;
}

interface Summary {
  totalBills: number;
  totalItems: number;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
}

interface PaymentSummary {
  cash: number;
  upi: number;
  card: number;
  credit: number;
}

type Period =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export default function SalesReportPage() {
  const [period, setPeriod] =
    useState<Period>("DAILY");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [paymentSummary, setPaymentSummary] =
    useState<PaymentSummary | null>(null);

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

      let url = `/api/reports/sales?period=${period}`;

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
            "Failed to load sales report"
        );
      }

      setSales(data.sales || []);
      setSummary(data.summary || null);
      setPaymentSummary(
        data.paymentSummary || null
      );
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load sales report";

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
          Sales Report
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View sales performance by day, week,
          month or custom date range.
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

      {/* Report Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {periodLabel()} Sales
        </h2>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading sales report...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Bills
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary?.totalBills || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Items
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary?.totalItems || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Subtotal
              </p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatCurrency(
                  summary?.subtotal || 0
                )}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Discount
              </p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatCurrency(
                  summary?.discount || 0
                )}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Tax
              </p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatCurrency(
                  summary?.tax || 0
                )}
              </p>
            </div>

            <div className="rounded-xl border border-gray-900 bg-gray-900 p-5 shadow-sm">
              <p className="text-sm text-gray-300">
                Grand Total
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {formatCurrency(
                  summary?.grandTotal || 0
                )}
              </p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">
              Payment Summary
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Cash
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(
                    paymentSummary?.cash || 0
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  UPI
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(
                    paymentSummary?.upi || 0
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Card
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(
                    paymentSummary?.card || 0
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Credit
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(
                    paymentSummary?.credit || 0
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Sales Transactions
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {sales.length} completed sale
                {sales.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            {sales.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No sales found for this period.
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
                        Bill No.
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-gray-700">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-center font-semibold text-gray-700">
                        Items
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-gray-700">
                        Discount
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-gray-700">
                        Tax
                      </th>

                      <th className="px-5 py-3 text-right font-semibold text-gray-700">
                        Grand Total
                      </th>

                      <th className="px-5 py-3 text-center font-semibold text-gray-700">
                        Payment
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sales.map((sale) => (
                      <tr
                        key={sale._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                          {formatDate(
                            sale.saleDate
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                          {sale.billNumber}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {sale.customer
                              ?.customerName ||
                              sale.customerName ||
                              "Walk-in Customer"}
                          </div>

                          {(sale.customer
                            ?.phone ||
                            sale.customerPhone) && (
                            <div className="text-xs text-gray-500">
                              {sale.customer
                                ?.phone ||
                                sale.customerPhone}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center text-gray-700">
                          {sale.items.reduce(
                            (sum, item) =>
                              sum +
                              Number(
                                item.quantity || 0
                              ),
                            0
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-gray-700">
                          {formatCurrency(
                            sale.discount
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-gray-700">
                          {formatCurrency(
                            sale.tax
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(
                            sale.grandTotal
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {sale.paymentMethod}
                          </span>
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
  );
}

