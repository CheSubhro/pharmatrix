
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface SaleItem {
  medicineName: string;
  genericName?: string;
  batchNumber?: string;
  quantity: number;
  sellingPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

interface Sale {
  _id: string;
  billNumber: string;

  customerName?: string;
  customerPhone?: string;

  items: SaleItem[];

  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;

  paymentMethod:
    | "CASH"
    | "UPI"
    | "CARD"
    | "CREDIT";

  paymentStatus:
    | "PAID"
    | "PENDING"
    | "PARTIAL";

  status:
    | "DRAFT"
    | "COMPLETED"
    | "CANCELLED";

  saleDate: string;

  note?: string;
}

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const saleId = params.id as string;

  const [sale, setSale] =
    useState<Sale | null>(null);

  const [loading, setLoading] =
    useState(true);

  const fetchSale = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/sales/${saleId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load sale"
        );
      }

      setSale(data.sale);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load bill"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (saleId) {
      fetchSale();
    }
  }, [saleId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading bill...
        </p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Bill not found
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          The requested sale could not be found.
        </p>

        <button
          type="button"
          onClick={() => router.push("/sales")}
          className="mt-5 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Hidden during print */}
      <div className="sale-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bill Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and print complete sale information
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/sales")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Sales
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Print / PDF
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="sale-invoice-print rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Invoice Header */}
        <div className="flex flex-col gap-5 border-b-2 border-gray-900 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-wide text-gray-900">
              PHARMATRIX
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Pharmacy Management System
            </p>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Sales Invoice
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Bill Number
            </div>

            <div className="mt-1 text-xl font-bold text-gray-900">
              {sale.billNumber}
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {formatDate(sale.saleDate)}
            </div>

            <div className="mt-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  sale.status === "COMPLETED"
                    ? "bg-green-100 text-green-700"
                    : sale.status === "CANCELLED"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {sale.status}
              </span>
            </div>
          </div>
        </div>

        {/* Customer + Payment */}
        <div className="grid grid-cols-1 gap-6 border-b border-gray-200 py-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Bill To
            </h3>

            <div className="mt-2 text-sm font-semibold text-gray-900">
              {sale.customerName ||
                "Walk-in Customer"}
            </div>

            {sale.customerPhone && (
              <div className="mt-1 text-sm text-gray-500">
                {sale.customerPhone}
              </div>
            )}
          </div>

          <div className="sm:text-right">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Payment
            </h3>

            <div className="mt-2 text-sm font-semibold text-gray-900">
              {sale.paymentMethod}
            </div>

            <div className="mt-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  sale.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-700"
                    : sale.paymentStatus ===
                      "PARTIAL"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {sale.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="py-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
            Medicine Details
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    #
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Medicine
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Batch
                  </th>

                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Qty
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Rate
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Tax
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Discount
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.items.map(
                  (item, index) => (
                    <tr
                      key={`${item.medicineName}-${index}`}
                      className="border-b border-gray-100"
                    >
                      <td className="px-3 py-4 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-3 py-4">
                        <div className="font-medium text-gray-900">
                          {item.medicineName}
                        </div>

                        {item.genericName && (
                          <div className="mt-1 text-xs text-gray-500">
                            {item.genericName}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 text-gray-600">
                        {item.batchNumber || "-"}
                      </td>

                      <td className="px-3 py-4 text-center font-medium text-gray-900">
                        {item.quantity}
                      </td>

                      <td className="px-3 py-4 text-right text-gray-600">
                        ₹
                        {item.sellingPrice.toFixed(
                          2
                        )}
                      </td>

                      <td className="px-3 py-4 text-right text-gray-600">
                        {item.taxRate}%
                      </td>

                      <td className="px-3 py-4 text-right text-gray-600">
                        ₹
                        {item.discount.toFixed(
                          2
                        )}
                      </td>

                      <td className="px-3 py-4 text-right font-semibold text-gray-900">
                        ₹
                        {item.total.toFixed(
                          2
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="border-t-2 border-gray-900 pt-6">
          <div className="ml-auto max-w-sm space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Subtotal
              </span>

              <span className="font-medium text-gray-900">
                ₹{sale.subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Discount
              </span>

              <span className="font-medium text-gray-900">
                ₹{sale.discount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Taxable Amount
              </span>

              <span className="font-medium text-gray-900">
                ₹
                {(
                  sale.subtotal -
                  sale.discount
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                GST / Tax
              </span>

              <span className="font-medium text-gray-900">
                ₹{sale.tax.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-300 pt-4">
              <span className="text-base font-bold text-gray-900">
                Grand Total
              </span>

              <span className="text-xl font-bold text-gray-900">
                ₹{sale.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        {sale.note && (
          <div className="mt-6 border-t border-gray-200 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Note
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {sale.note}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm font-medium text-gray-700">
            Thank you for your purchase.
          </p>

          <p className="mt-1 text-xs text-gray-400">
            This is a computer-generated invoice.
          </p>
        </div>
      </div>
    </div>
  );
}

