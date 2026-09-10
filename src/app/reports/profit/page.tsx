
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ProfitItem {
  medicineName: string;
  genericName?: string;
  batchNumber: string;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface ProfitSale {
  _id: string;
  billNumber: string;
  saleDate: string;
  customerName: string;
  totalItems: number;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  profitMargin: number;
  paymentMethod: string;
  items: ProfitItem[];
}

interface MedicineProfit {
  medicineName: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

interface ProfitSummary {
  totalBills: number;
  totalItems: number;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
}

interface ProfitResponse {
  success: boolean;
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
  summary: ProfitSummary;
  sales: ProfitSale[];
  medicineSummary: MedicineProfit[];
  message?: string;
}

type Period =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export default function ProfitReportPage() {
  const [period, setPeriod] =
    useState<Period>("DAILY");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [summary, setSummary] =
    useState<ProfitSummary | null>(null);

  const [sales, setSales] =
    useState<ProfitSale[]>([]);

  const [medicineSummary, setMedicineSummary] =
    useState<MedicineProfit[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    fetchProfitReport();
  }, []);

  const fetchProfitReport = async () => {
    try {
      setLoading(true);
      setError("");

      if (
        period === "CUSTOM" &&
        (!fromDate || !toDate)
      ) {
        setLoading(false);
        return;
      }

      const params =
        new URLSearchParams();

      params.set("period", period);

      if (period === "CUSTOM") {
        params.set("from", fromDate);
        params.set("to", toDate);
      }

      const response = await fetch(
        `/api/reports/profit?${params.toString()}`
      );

      const data: ProfitResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load profit report"
        );
      }

      setSummary(data.summary);
      setSales(data.sales || []);
      setMedicineSummary(
        data.medicineSummary || []
      );
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load profit report";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredSales = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    if (!searchText) {
      return sales;
    }

    return sales.filter((sale) => {
      return (
        sale.billNumber
          .toLowerCase()
          .includes(searchText) ||
        sale.customerName
          .toLowerCase()
          .includes(searchText) ||
        sale.items.some((item) =>
          item.medicineName
            .toLowerCase()
            .includes(searchText)
        )
      );
    });
  }, [sales, search]);

  const getProfitClass = (profit: number) => {
    if (profit > 0) {
      return "text-green-600";
    }

    if (profit < 0) {
      return "text-red-600";
    }

    return "text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Profit Report
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Analyze sales revenue, purchase cost,
          gross profit and profit margin.
        </p>
      </div>

      {/* Period Filter */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="w-full lg:w-52">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Report Period
            </label>

            <select
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value as Period
                )
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
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
                Custom
              </option>
            </select>
          </div>

          {period === "CUSTOM" && (
            <>
              <div className="w-full lg:w-52">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  From
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <div className="w-full lg:w-52">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  To
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={fetchProfitReport}
            disabled={
              period === "CUSTOM" &&
              (!fromDate || !toDate)
            }
            className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Bills
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.totalBills}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Revenue
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(
                summary.totalRevenue
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Cost
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(
                summary.totalCost
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Gross Profit
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${getProfitClass(
                summary.grossProfit
              )}`}
            >
              {formatCurrency(
                summary.grossProfit
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Profit Margin
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${getProfitClass(
                summary.profitMargin
              )}`}
            >
              {summary.profitMargin.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Additional Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Items Sold
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {summary.totalItems}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Discount
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatCurrency(
                summary.totalDiscount
              )}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Tax Collected
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatCurrency(
                summary.totalTax
              )}
            </p>
          </div>
        </div>
      )}

      {/* Medicine-wise Profit */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Medicine-wise Profit
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Profit contribution by medicine.
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Loading profit report...
          </div>
        ) : medicineSummary.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No profit data found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Medicine
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Qty Sold
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Revenue
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Cost
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Profit
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Margin
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {medicineSummary.map(
                  (item) => (
                    <tr
                      key={item.medicineName}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {item.medicineName}
                      </td>

                      <td className="px-5 py-4 text-right text-gray-700">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-4 text-right text-gray-700">
                        {formatCurrency(
                          item.revenue
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-gray-700">
                        {formatCurrency(
                          item.cost
                        )}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${getProfitClass(
                          item.profit
                        )}`}
                      >
                        {formatCurrency(
                          item.profit
                        )}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${getProfitClass(
                          item.profitMargin
                        )}`}
                      >
                        {item.profitMargin.toFixed(
                          2
                        )}
                        %
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Search */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Search Sales
        </label>

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search bill number, customer or medicine..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Sales Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Sales Profit Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredSales.length} of{" "}
            {sales.length} bills
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Loading sales...
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchProfitReport}
              className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            No sales found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Date
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Bill No.
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Items
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Revenue
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Cost
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Profit
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-700">
                    Margin
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Payment
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 text-gray-700">
                      {formatDate(
                        sale.saleDate
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {sale.billNumber}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {sale.customerName}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {sale.totalItems}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {formatCurrency(
                        sale.revenue
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {formatCurrency(
                        sale.cost
                      )}
                    </td>

                    <td
                      className={`px-5 py-4 text-right font-semibold ${getProfitClass(
                        sale.grossProfit
                      )}`}
                    >
                      {formatCurrency(
                        sale.grossProfit
                      )}
                    </td>

                    <td
                      className={`px-5 py-4 text-right font-semibold ${getProfitClass(
                        sale.profitMargin
                      )}`}
                    >
                      {sale.profitMargin.toFixed(
                        2
                      )}
                      %
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {sale.paymentMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

