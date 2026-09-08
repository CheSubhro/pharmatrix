

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  strength?: string;
  dosageForm?: string;
  purchasePrice?: number;
}

interface PurchaseItem {
  medicine: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: string;
  purchasePrice: string;
}

export default function CreatePurchasePage() {
  const router = useRouter();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [saving, setSaving] = useState(false);

  const [purchaseNumber, setPurchaseNumber] = useState(
    `PO-${Date.now()}`
  );
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tax, setTax] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ORDERED">("DRAFT");

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      medicine: "",
      batchNumber: "",
      manufacturingDate: "",
      expiryDate: "",
      quantity: "",
      purchasePrice: "",
    },
  ]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoadingMedicines(true);

      const response = await fetch("/api/medicines");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch medicines");
      }

      setMedicines(data.medicines || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load medicines");
    } finally {
      setLoadingMedicines(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        medicine: "",
        batchNumber: "",
        manufacturingDate: "",
        expiryDate: "",
        quantity: "",
        purchasePrice: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one medicine is required");
      return;
    }

    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (
    index: number,
    field: keyof PurchaseItem,
    value: string
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleMedicineChange = (
    index: number,
    medicineId: string
  ) => {
    const medicine = medicines.find(
      (item) => item._id === medicineId
    );

    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              medicine: medicineId,
              purchasePrice:
                medicine?.purchasePrice !== undefined
                  ? String(medicine.purchasePrice)
                  : item.purchasePrice,
            }
          : item
      )
    );
  };

  const getItemTotal = (item: PurchaseItem) => {
    const quantity = Number(item.quantity) || 0;
    const purchasePrice = Number(item.purchasePrice) || 0;

    return quantity * purchasePrice;
  };

  const subtotal = items.reduce(
    (sum, item) => sum + getItemTotal(item),
    0
  );

  const taxAmount = Number(tax) || 0;
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!purchaseNumber.trim()) {
      toast.error("Purchase number is required");
      return;
    }

    if (!supplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    if (!purchaseDate) {
      toast.error("Purchase date is required");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.medicine) {
        toast.error(`Please select medicine for item ${i + 1}`);
        return;
      }

      if (!item.batchNumber.trim()) {
        toast.error(`Batch number is required for item ${i + 1}`);
        return;
      }

      if (!item.expiryDate) {
        toast.error(`Expiry date is required for item ${i + 1}`);
        return;
      }

      if (
        item.manufacturingDate &&
        item.manufacturingDate > item.expiryDate
      ) {
        toast.error(
          `Manufacturing date cannot be after expiry date for item ${
            i + 1
          }`
        );
        return;
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        toast.error(
          `Quantity must be a positive whole number for item ${i + 1}`
        );
        return;
      }

      const purchasePrice = Number(item.purchasePrice);

      if (
        !Number.isFinite(purchasePrice) ||
        purchasePrice < 0
      ) {
        toast.error(
          `Purchase price is invalid for item ${i + 1}`
        );
        return;
      }
    }

    if (taxAmount < 0) {
      toast.error("Tax cannot be negative");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        purchaseNumber: purchaseNumber.trim(),
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        status,
        items: items.map((item) => ({
          medicine: item.medicine,
          batchNumber: item.batchNumber.trim(),
          manufacturingDate:
            item.manufacturingDate || undefined,
          expiryDate: item.expiryDate,
          quantity: Number(item.quantity),
          purchasePrice: Number(item.purchasePrice),
        })),
        tax: taxAmount,
        note: note.trim() || undefined,
      };

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create purchase"
        );
      }

      toast.success("Purchase created successfully");

      router.push("/purchases");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || "Failed to create purchase"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Purchase
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a purchase order for medicines.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Purchase Information */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Purchase Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Purchase Number *
                </label>

                <input
                  type="text"
                  value={purchaseNumber}
                  onChange={(e) =>
                    setPurchaseNumber(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="PO-001"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supplier Name *
                </label>

                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) =>
                    setSupplierName(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="ABC Pharma"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supplier Phone
                </label>

                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) =>
                    setSupplierPhone(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Invoice Number
                </label>

                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) =>
                    setInvoiceNumber(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="INV-001"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Purchase Date *
                </label>

                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) =>
                    setPurchaseDate(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "DRAFT" | "ORDERED"
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ORDERED">Ordered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medicine Items */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Purchase Items
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add medicines and batch details.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                + Add Medicine
              </button>
            </div>

            <div className="space-y-5">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border bg-gray-50 p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Item {index + 1}
                    </h3>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Medicine *
                      </label>

                      <select
                        value={item.medicine}
                        disabled={loadingMedicines}
                        onChange={(e) =>
                          handleMedicineChange(
                            index,
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                      >
                        <option value="">
                          {loadingMedicines
                            ? "Loading medicines..."
                            : "Select medicine"}
                        </option>

                        {medicines.map((medicine) => (
                          <option
                            key={medicine._id}
                            value={medicine._id}
                          >
                            {medicine.name}
                            {medicine.strength
                              ? ` - ${medicine.strength}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Batch Number *
                      </label>

                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "batchNumber",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                        placeholder="BATCH-001"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Quantity *
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                        placeholder="50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Purchase Price *
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.purchasePrice}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "purchasePrice",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                        placeholder="10.00"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Manufacturing Date
                      </label>

                      <input
                        type="date"
                        value={item.manufacturingDate}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "manufacturingDate",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Expiry Date *
                      </label>

                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "expiryDate",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <div className="rounded-lg bg-white px-4 py-3 text-right shadow-sm">
                      <p className="text-xs text-gray-500">
                        Item Total
                      </p>

                      <p className="text-lg font-bold text-gray-900">
                        ₹{getItemTotal(item).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note & Summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">
                Additional Information
              </h2>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tax
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="0"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Note
                </label>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="Additional purchase notes..."
                />
              </div>
            </div>

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
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax
                  </span>

                  <span className="font-medium text-gray-900">
                    ₹{taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      Grand Total
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/purchases")}
              className="rounded-lg border px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
