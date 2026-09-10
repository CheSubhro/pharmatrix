

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Period =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY";

interface TrendItem {
  date: string;
  sales?: number;
  bills?: number;
  items?: number;
  purchases?: number;
  invoices?: number;
}

interface TopMedicine {
  rank: number;
  medicineName: string;
  quantitySold: number;
  revenue: number;
}

interface AnalyticsResponse {
  success: boolean;
  message?: string;

  summary?: {
    totalSales: number;
    totalPurchases: number;
    totalBills: number;
    totalInvoices: number;
    totalItemsSold: number;
  };

  salesTrend?: TrendItem[];
  purchaseTrend?: TrendItem[];
  topMedicines?: TopMedicine[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] =
    useState<Period>("MONTHLY");

  const [report, setReport] =
    useState<AnalyticsResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/reports/analytics?period=${period}`
      );

      const data: AnalyticsResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to fetch analytics"
        );
      }

      setReport(data);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load analytics";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const salesTrend =
    report?.salesTrend || [];

  const purchaseTrend =
    report?.purchaseTrend || [];

  const topMedicines =
    report?.topMedicines || [];

  const maxSales = useMemo(() => {
    return Math.max(
      ...salesTrend.map(
        (item) => item.sales || 0
      ),
      1
    );
  }, [salesTrend]);

  const maxPurchases = useMemo(() => {
    return Math.max(
      ...purchaseTrend.map(
        (item) =>
          item.purchases || 0
      ),
      1
    );
  }, [purchaseTrend]);

  const maxMedicineQuantity =
    useMemo(() => {
      return Math.max(
        ...topMedicines.map(
          (item) =>
            item.quantitySold
        ),
        1
      );
    }, [topMedicines]);

  const formatCurrency = (
    value: number
  ) => {
    return `₹${value.toFixed(2)}`;
  };

  const formatDate = (
    date: string
  ) => {
    const parsed = new Date(date);

    if (period === "DAILY") {
      return parsed.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      );
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  const periodLabel = {
    DAILY: "Today",
    WEEKLY: "This Week",
    MONTHLY: "This Month",
  }[period];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports Analytics
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Visual overview of sales,
            purchases and top-selling
            medicines.
          </p>
        </div>

        <div className="flex gap-2">
          {(
            [
              "DAILY",
              "WEEKLY",
              "MONTHLY",
            ] as Period[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setPeriod(item)
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                period === item
                  ? "bg-black text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item === "DAILY"
                ? "Daily"
                : item === "WEEKLY"
                ? "Weekly"
                : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Sales
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(
                  report?.summary
                    ?.totalSales || 0
                )}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Purchases
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(
                  report?.summary
                    ?.totalPurchases || 0
                )}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Bills
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {report?.summary
                  ?.totalBills || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Purchase Invoices
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {report?.summary
                  ?.totalInvoices || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Items Sold
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {report?.summary
                  ?.totalItemsSold || 0}
              </p>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Sales Trend
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Daily sales revenue —{" "}
                {periodLabel}
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="flex h-72 items-end gap-2 border-b border-l border-gray-200 px-3 pb-2">
                  {salesTrend.map(
                    (item) => {
                      const value =
                        item.sales || 0;

                      const height =
                        (value /
                          maxSales) *
                        100;

                      return (
                        <div
                          key={item.date}
                          className="flex h-full flex-1 flex-col justify-end"
                        >
                          <div className="group relative flex h-full items-end justify-center">
                            <div
                              className="w-full max-w-8 rounded-t-md bg-black transition-opacity hover:opacity-70"
                              style={{
                                height: `${Math.max(
                                  height,
                                  value > 0
                                    ? 3
                                    : 0
                                )}%`,
                              }}
                              title={`${formatCurrency(
                                value
                              )}`}
                            />

                            {value > 0 && (
                              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                                {formatCurrency(
                                  value
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-2 text-center text-[10px] text-gray-500">
                            {formatDate(
                              item.date
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sales vs Purchase */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Purchase Chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Purchase Trend
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Daily purchase amount —{" "}
                  {periodLabel}
                </p>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="flex h-60 items-end gap-2 border-b border-l border-gray-200 px-3 pb-2">
                    {purchaseTrend.map(
                      (item) => {
                        const value =
                          item.purchases ||
                          0;

                        const height =
                          (value /
                            maxPurchases) *
                          100;

                        return (
                          <div
                            key={item.date}
                            className="flex h-full flex-1 flex-col justify-end"
                          >
                            <div className="group relative flex h-full items-end justify-center">
                              <div
                                className="w-full max-w-7 rounded-t-md bg-gray-700"
                                style={{
                                  height: `${Math.max(
                                    height,
                                    value > 0
                                      ? 3
                                      : 0
                                  )}%`,
                                }}
                                title={formatCurrency(
                                  value
                                )}
                              />

                              {value > 0 && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                                  {formatCurrency(
                                    value
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-2 text-center text-[10px] text-gray-500">
                              {formatDate(
                                item.date
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sales vs Purchase */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sales vs Purchase
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Overall comparison for{" "}
                  {periodLabel.toLowerCase()}.
                </p>
              </div>

              <div className="space-y-6 pt-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-600">
                      Sales
                    </span>

                    <span className="font-semibold text-gray-900">
                      {formatCurrency(
                        report?.summary
                          ?.totalSales ||
                          0
                      )}
                    </span>
                  </div>

                  <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width: `${
                          (
                            (report
                              ?.summary
                              ?.totalSales ||
                              0) /
                            Math.max(
                              report
                                ?.summary
                                ?.totalSales ||
                                0,
                              report
                                ?.summary
                                ?.totalPurchases ||
                                0,
                              1
                            )
                          ) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-600">
                      Purchases
                    </span>

                    <span className="font-semibold text-gray-900">
                      {formatCurrency(
                        report?.summary
                          ?.totalPurchases ||
                          0
                      )}
                    </span>
                  </div>

                  <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-500"
                      style={{
                        width: `${
                          (
                            (report
                              ?.summary
                              ?.totalPurchases ||
                              0) /
                            Math.max(
                              report
                                ?.summary
                                ?.totalSales ||
                                0,
                              report
                                ?.summary
                                ?.totalPurchases ||
                                0,
                              1
                            )
                          ) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Medicines */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Top-selling Medicines
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Top 10 medicines by quantity
                sold.
              </p>
            </div>

            {topMedicines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                <p className="text-sm text-gray-500">
                  No medicine sales found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topMedicines.map(
                  (medicine) => {
                    const width =
                      (medicine.quantitySold /
                        maxMedicineQuantity) *
                      100;

                    return (
                      <div
                        key={
                          medicine.medicineName
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                              #
                              {
                                medicine.rank
                              }
                            </span>

                            <span className="truncate text-sm font-medium text-gray-900">
                              {
                                medicine.medicineName
                              }
                            </span>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {
                                medicine.quantitySold
                              }{" "}
                              units
                            </div>

                            <div className="text-xs text-gray-500">
                              {formatCurrency(
                                medicine.revenue
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-black"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

