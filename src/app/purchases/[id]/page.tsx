

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
  rack?: string;
  shelf?: string;
  purchasePrice?: number;
  sellingPrice?: number;
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

interface Supplier {
  _id: string;
  supplierName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
  paymentTerms?: string;
  isActive: boolean;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  supplier?: Supplier | string;
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

interface Rack {
  _id: string;
  name: string;
  code: string;
}

export default function PurchaseDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const purchaseId = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    if (purchaseId) {
      fetchData();
    }
  }, [purchaseId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [purchaseResponse, rackResponse] = await Promise.all([
        fetch(`/api/purchases/${purchaseId}`),
        fetch("/api/racks"),
      ]);

      const purchaseData = await purchaseResponse.json();
      const rackData = await rackResponse.json();

      if (!purchaseResponse.ok || !purchaseData.success) {
        throw new Error(
          purchaseData.message || "Failed to fetch purchase"
        );
      }

      const purchaseRecord: Purchase = purchaseData.purchase;

      setPurchase(purchaseRecord);

      setRacks(
        rackData.success ? rackData.racks || [] : []
      );

      /*
       * Supplier handling
       *
       * New purchases have supplier linked to Supplier collection.
       * If the purchase API already populated supplier, use it directly.
       * Otherwise fetch supplier details separately.
       */
      if (
        purchaseRecord.supplier &&
        typeof purchaseRecord.supplier === "object"
      ) {
        setSupplier(purchaseRecord.supplier);
      } else if (
        purchaseRecord.supplier &&
        typeof purchaseRecord.supplier === "string"
      ) {
        try {
          const supplierResponse = await fetch(
            `/api/suppliers/${purchaseRecord.supplier}`
          );

          const supplierData = await supplierResponse.json();

          if (supplierResponse.ok && supplierData.success) {
            setSupplier(supplierData.supplier);
          }
        } catch (supplierError) {
          console.error(
            "Failed to fetch supplier details:",
            supplierError
          );
        }
      }
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message || "Failed to load purchase"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRackName = (rackId?: string) => {
    if (!rackId) return "-";

    const rack = racks.find(
      (item) => item._id === rackId
    );

    if (!rack) return rackId;

    return `${rack.code} - ${rack.name}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatInvoiceDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusClass = (
    status: Purchase["status"]
  ) => {
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

  const getStatusLabel = (
    status: Purchase["status"]
  ) => {
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

  const receivePurchase = async () => {
    if (!purchase) return;

    try {
      setReceiving(true);

      const response = await fetch(
        `/api/purchases/${purchase._id}/receive`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to receive purchase"
        );
      }

      toast.success(
        "Purchase received and stock updated successfully"
      );

      await fetchData();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
          "Failed to receive purchase"
      );
    } finally {
      setReceiving(false);
    }
  };

  const handleReceivePurchase = () => {
    if (!purchase) return;

    if (purchase.status === "RECEIVED") {
      toast.error(
        "This purchase is already received"
      );
      return;
    }

    if (purchase.status === "CANCELLED") {
      toast.error(
        "Cancelled purchase cannot be received"
      );
      return;
    }

    toast("Receive this purchase?", {
      description:
        `${purchase.purchaseNumber} — ` +
        `all purchase quantities will be added to stock.`,

      action: {
        label: "Receive",
        onClick: () => {
          receivePurchase();
        },
      },

      cancel: {
        label: "Cancel",
        onClick: () => {},
      },

      duration: 10000,
    });
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading purchase...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">
              Purchase not found
            </h1>

            <button
              onClick={() =>
                router.push("/purchases")
              }
              className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Purchases
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================
          NORMAL PURCHASE DETAILS
      ========================== */}
      <div className="min-h-screen bg-gray-50 p-6 print:hidden">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                onClick={() =>
                  router.push("/purchases")
                }
                className="mb-3 text-sm font-medium text-gray-600 hover:text-black"
              >
                ← Back to Purchases
              </button>

              <h1 className="text-2xl font-bold text-gray-900">
                Purchase Details
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {purchase.purchaseNumber}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* Print Invoice */}
              <button
                onClick={handlePrintInvoice}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                🖨 Print Invoice
              </button>

              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
                  purchase.status
                )}`}
              >
                {getStatusLabel(
                  purchase.status
                )}
              </span>

              {(purchase.status === "ORDERED" ||
                purchase.status === "DRAFT") && (
                <button
                  onClick={handleReceivePurchase}
                  disabled={receiving}
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {receiving
                    ? "Receiving..."
                    : "Receive Purchase"}
                </button>
              )}
            </div>
          </div>

          {/* Purchase Information */}
          <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Purchase Information
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Purchase Number
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {purchase.purchaseNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Supplier
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {supplier?.companyName ||
                    purchase.supplierName}
                </p>

                {supplier?.supplierName && (
                  <p className="mt-1 text-sm text-gray-500">
                    Contact: {supplier.supplierName}
                  </p>
                )}

                {(supplier?.phone ||
                  purchase.supplierPhone) && (
                  <p className="mt-1 text-sm text-gray-500">
                    {supplier?.phone ||
                      purchase.supplierPhone}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Invoice Number
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {purchase.invoiceNumber || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Purchase Date
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(
                    purchase.purchaseDate
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Details */}
          {supplier && (
            <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">
                Supplier Details
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Supplier Name
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.supplierName}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Company
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.companyName || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Contact Person
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.contactPerson || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Phone
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.phone ||
                      purchase.supplierPhone ||
                      "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.email || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    GSTIN
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.gstin || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Payment Terms
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.paymentTerms || "-"}
                  </p>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Address
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {supplier.address || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Purchase Items
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {purchase.items.length} medicine
                {purchase.items.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Medicine
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Rack / Shelf
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Batch
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Manufacturing
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Expiry
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Quantity
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Purchase Price
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {purchase.items.map(
                    (item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {item.medicine?.name ||
                              "Unknown Medicine"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.medicine
                              ?.genericName || "-"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.medicine
                              ?.company || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {getRackName(
                              item.medicine?.rack
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.medicine?.shelf ||
                              "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                          {item.batchNumber}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {formatDate(
                            item.manufacturingDate
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {formatDate(
                            item.expiryDate
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          {item.quantity}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-gray-700">
                          ₹
                          {item.purchasePrice.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Note */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Note
              </h2>

              <p className="whitespace-pre-wrap text-sm text-gray-600">
                {purchase.note ||
                  "No notes added."}
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">
                Purchase Summary
              </h2>

              <div className="space-y-3">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900">
                    ₹{purchase.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax
                  </span>

                  <span className="font-medium text-gray-900">
                    ₹{purchase.tax.toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Grand Total
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      ₹
                      {purchase.grandTotal.toFixed(
                        2
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Receive Information */}
          {purchase.status === "RECEIVED" && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex gap-3">

                <div className="mt-0.5 text-green-700">
                  ✓
                </div>

                <div>
                  <h3 className="font-semibold text-green-800">
                    Purchase Received
                  </h3>

                  <p className="mt-1 text-sm text-green-700">
                    This purchase has been received
                    successfully. The purchased
                    quantities have been added to
                    stock and stock movements have
                    been recorded.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================
          PRINTABLE PURCHASE INVOICE
      ========================== */}
      <div className="purchase-invoice-print bg-white p-8">
        <div className="mx-auto max-w-5xl">

          {/* Invoice Header */}
          <div className="border-b-2 border-black pb-5">

            <div className="flex items-start justify-between gap-8">

              <div>
                <h1 className="text-3xl font-bold tracking-wide text-black">
                  PHARMATRIX
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                  Pharmacy Management System
                </p>

                <p className="mt-4 text-sm text-gray-700">
                  Purchase Invoice
                </p>
              </div>

              <div className="text-right">
                <h2 className="text-2xl font-bold text-black">
                  PURCHASE INVOICE
                </h2>

                <p className="mt-2 text-sm">
                  <span className="font-semibold">
                    Purchase No:
                  </span>{" "}
                  {purchase.purchaseNumber}
                </p>

                <p className="mt-1 text-sm">
                  <span className="font-semibold">
                    Invoice No:
                  </span>{" "}
                  {purchase.invoiceNumber ||
                    "-"}
                </p>

                <p className="mt-1 text-sm">
                  <span className="font-semibold">
                    Date:
                  </span>{" "}
                  {formatInvoiceDate(
                    purchase.purchaseDate
                  )}
                </p>

                <p className="mt-1 text-sm">
                  <span className="font-semibold">
                    Status:
                  </span>{" "}
                  {getStatusLabel(
                    purchase.status
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Section */}
          <div className="mt-6 grid grid-cols-2 gap-8">

            <div className="rounded-lg border p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                Supplier Details
              </h3>

              <p className="text-base font-bold text-black">
                {supplier?.companyName ||
                  purchase.supplierName}
              </p>

              {supplier?.supplierName && (
                <p className="mt-1 text-sm text-gray-700">
                  Contact Person:{" "}
                  {supplier.supplierName}
                </p>
              )}

              {supplier?.contactPerson && (
                <p className="mt-1 text-sm text-gray-700">
                  Contact:{" "}
                  {supplier.contactPerson}
                </p>
              )}

              <p className="mt-1 text-sm text-gray-700">
                Phone:{" "}
                {supplier?.phone ||
                  purchase.supplierPhone ||
                  "-"}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Email:{" "}
                {supplier?.email || "-"}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                GSTIN:{" "}
                {supplier?.gstin || "-"}
              </p>

              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                Address:{" "}
                {supplier?.address || "-"}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Payment Terms:{" "}
                {supplier?.paymentTerms || "-"}
              </p>
            </div>

            <div className="rounded-lg border p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                Purchase Information
              </h3>

              <div className="space-y-2 text-sm">

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">
                    Purchase Number
                  </span>

                  <span className="font-semibold">
                    {purchase.purchaseNumber}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">
                    Invoice Number
                  </span>

                  <span className="font-semibold">
                    {purchase.invoiceNumber ||
                      "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">
                    Purchase Date
                  </span>

                  <span className="font-semibold">
                    {formatInvoiceDate(
                      purchase.purchaseDate
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">
                    Status
                  </span>

                  <span className="font-semibold">
                    {getStatusLabel(
                      purchase.status
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">
                    Total Items
                  </span>

                  <span className="font-semibold">
                    {purchase.items.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mt-8">

            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
              Purchased Medicines
            </h3>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-3 text-left text-xs font-bold">
                    #
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-left text-xs font-bold">
                    Medicine
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-left text-xs font-bold">
                    Batch
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-left text-xs font-bold">
                    Mfg.
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-left text-xs font-bold">
                    Expiry
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-right text-xs font-bold">
                    Qty
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-right text-xs font-bold">
                    Rate
                  </th>

                  <th className="border border-gray-300 px-3 py-3 text-right text-xs font-bold">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {purchase.items.map(
                  (item, index) => (
                    <tr key={index}>

                      <td className="border border-gray-300 px-3 py-3 text-sm">
                        {index + 1}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        <p className="text-sm font-semibold">
                          {item.medicine?.name ||
                            "Unknown Medicine"}
                        </p>

                        {item.medicine
                          ?.genericName && (
                          <p className="mt-1 text-xs text-gray-500">
                            {
                              item.medicine
                                .genericName
                            }
                          </p>
                        )}

                        {item.medicine?.strength && (
                          <p className="text-xs text-gray-500">
                            {
                              item.medicine
                                .strength
                            }
                          </p>
                        )}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-sm">
                        {item.batchNumber}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-sm">
                        {formatDate(
                          item.manufacturingDate
                        )}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-sm">
                        {formatDate(
                          item.expiryDate
                        )}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-right text-sm font-semibold">
                        {item.quantity}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-right text-sm">
                        ₹
                        {item.purchasePrice.toFixed(
                          2
                        )}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-right text-sm font-semibold">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Invoice Section */}
          <div className="mt-8 flex justify-end">

            <div className="w-full max-w-sm">

              <div className="flex justify-between border-b py-2 text-sm">
                <span className="text-gray-600">
                  Subtotal
                </span>

                <span className="font-semibold">
                  ₹{purchase.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between border-b py-2 text-sm">
                <span className="text-gray-600">
                  Tax
                </span>

                <span className="font-semibold">
                  ₹{purchase.tax.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-lg font-bold">
                  Grand Total
                </span>

                <span className="text-xl font-bold">
                  ₹
                  {purchase.grandTotal.toFixed(
                    2
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Note */}
          {purchase.note && (
            <div className="mt-8 border-t pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                Note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {purchase.note}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 border-t pt-5 text-center">
            <p className="text-xs text-gray-500">
              This is a computer-generated purchase
              invoice.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              PHARMATRIX
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

