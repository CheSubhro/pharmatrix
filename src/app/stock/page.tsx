
"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  strength?: string;
  dosageForm?: string;
}

interface Batch {
  _id: string;
  medicine: string | Medicine;
  batchNumber: string;
  expiryDate: string;
  currentStock: number;
  initialStock: number;
}

interface StockMovement {
  _id: string;
  medicine: Medicine;
  batch: {
    _id: string;
    batchNumber: string;
    expiryDate: string;
    currentStock: number;
  };
  type: "IN" | "OUT";
  quantity: number;
  reason?: string;
  reference?: string;
  note?: string;
  movementDate: string;
}

export default function StockPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [movements, setMovements] = useState<
    StockMovement[]
  >([]);

  const [selectedMedicine, setSelectedMedicine] =
    useState("");

  const [selectedBatch, setSelectedBatch] =
    useState("");

  const [type, setType] =
    useState<"IN" | "OUT">("IN");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [loadingMedicines, setLoadingMedicines] =
    useState(true);

  const [loadingBatches, setLoadingBatches] =
    useState(false);

  const [loadingMovements, setLoadingMovements] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const fetchMedicines = async () => {
    try {
      setLoadingMedicines(true);

      const response = await fetch("/api/medicines");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch medicines"
        );
      }

      setMedicines(data.medicines || []);
    } catch (error) {
      console.error(
        "Fetch medicines error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load medicines"
      );
    } finally {
      setLoadingMedicines(false);
    }
  };

  const fetchBatches = async (medicineId: string) => {
    if (!medicineId) {
      setBatches([]);
      setSelectedBatch("");
      return;
    }

    try {
      setLoadingBatches(true);
      setSelectedBatch("");

      const response = await fetch(
        "/api/medicine-batches"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch batches"
        );
      }

      const filteredBatches = (data.batches || []).filter(
        (batch: Batch) => {
          const batchMedicineId =
            typeof batch.medicine === "string"
              ? batch.medicine
              : batch.medicine?._id;

          return batchMedicineId === medicineId;
        }
      );

      setBatches(filteredBatches);
    } catch (error) {
      console.error(
        "Fetch batches error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load batches"
      );

      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoadingMovements(true);

      const response = await fetch(
        "/api/stock-movements"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch stock movements"
        );
      }

      setMovements(data.movements || []);
    } catch (error) {
      console.error(
        "Fetch movements error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load stock history"
      );
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchMovements();
  }, []);

  useEffect(() => {
    fetchBatches(selectedMedicine);
  }, [selectedMedicine]);

  const selectedBatchData = batches.find(
    (batch) => batch._id === selectedBatch
  );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!selectedMedicine) {
      toast.error("Please select a medicine");
      return;
    }

    if (!selectedBatch) {
      toast.error("Please select a batch");
      return;
    }

    if (quantity === "") {
      toast.error("Quantity is required");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      toast.error(
        "Quantity must be greater than 0"
      );
      return;
    }

    if (!Number.isInteger(parsedQuantity)) {
      toast.error(
        "Quantity must be a whole number"
      );
      return;
    }

    if (
      type === "OUT" &&
      selectedBatchData &&
      parsedQuantity > selectedBatchData.currentStock
    ) {
      toast.error(
        `Insufficient stock. Current stock is ${selectedBatchData.currentStock}`
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/stock-movements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicine: selectedMedicine,
            batch: selectedBatch,
            type,
            quantity: parsedQuantity,
            reason: reason.trim() || undefined,
            reference:
              reference.trim() || undefined,
            note: note.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update stock"
        );
      }

      toast.success(data.message);

      setQuantity("");
      setReason("");
      setReference("");
      setNote("");

      await fetchBatches(selectedMedicine);
      await fetchMovements();
    } catch (error) {
      console.error(
        "Stock movement error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update stock";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Stock Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage stock in, stock out and stock movement history.
          </p>
        </div>

        {/* Stock Movement Form */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Stock Movement
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add incoming stock or remove stock from a batch.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {/* Medicine */}
              <div>
                <label
                  htmlFor="medicine"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Medicine{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  id="medicine"
                  value={selectedMedicine}
                  onChange={(event) =>
                    setSelectedMedicine(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingMedicines || saving
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingMedicines
                      ? "Loading medicines..."
                      : "Select medicine"}
                  </option>

                  {medicines.map((item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.name}
                      {item.strength
                        ? ` - ${item.strength}`
                        : ""}
                      {item.company
                        ? ` (${item.company})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label
                  htmlFor="batch"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Batch{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  id="batch"
                  value={selectedBatch}
                  onChange={(event) =>
                    setSelectedBatch(
                      event.target.value
                    )
                  }
                  disabled={
                    !selectedMedicine ||
                    loadingBatches ||
                    saving
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {!selectedMedicine
                      ? "Select medicine first"
                      : loadingBatches
                      ? "Loading batches..."
                      : batches.length === 0
                      ? "No batches found"
                      : "Select batch"}
                  </option>

                  {batches.map((batch) => (
                    <option
                      key={batch._id}
                      value={batch._id}
                    >
                      {batch.batchNumber} — Stock:{" "}
                      {batch.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label
                  htmlFor="type"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Movement Type{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  id="type"
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value as
                        | "IN"
                        | "OUT"
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                >
                  <option value="IN">
                    Stock In
                  </option>

                  <option value="OUT">
                    Stock Out
                  </option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Quantity{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 20"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Reason
                </label>

                <select
                  id="reason"
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                >
                  <option value="">
                    Select reason
                  </option>

                  <option value="Purchase">
                    Purchase
                  </option>

                  <option value="Sale">
                    Sale
                  </option>

                  <option value="Return">
                    Return
                  </option>

                  <option value="Damaged">
                    Damaged
                  </option>

                  <option value="Expired">
                    Expired
                  </option>

                  <option value="Adjustment">
                    Stock Adjustment
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label
                  htmlFor="reference"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Reference
                </label>

                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(event) =>
                    setReference(
                      event.target.value
                    )
                  }
                  placeholder="e.g. INV-1001"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>

              {/* Note */}
              <div className="md:col-span-2 lg:col-span-3">
                <label
                  htmlFor="note"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Note
                </label>

                <textarea
                  id="note"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="Optional note..."
                  rows={3}
                  disabled={saving}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Selected Batch Info */}
            {selectedBatchData && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Selected Batch
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedBatchData.batchNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Current Stock
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {selectedBatchData.currentStock}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Expiry Date
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {formatDate(
                        selectedBatchData.expiryDate
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving
                  ? "Updating..."
                  : type === "IN"
                  ? "Add Stock"
                  : "Remove Stock"}
              </button>
            </div>
          </form>
        </div>

        {/* Stock Movement History */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Stock Movement History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Recent stock in and stock out transactions.
            </p>
          </div>

          {loadingMovements ? (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-500">
                Loading stock history...
              </p>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No stock movements found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Stock movement history will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Medicine
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Batch
                    </th>

                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Type
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      Quantity
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Reason
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Reference
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Note
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {movements.map((movement) => (
                    <tr
                      key={movement._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                        {formatDateTime(
                          movement.movementDate
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {movement.medicine?.name ||
                              "-"}
                          </p>

                          {movement.medicine
                            ?.strength && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {
                                movement.medicine
                                  .strength
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-700">
                        {movement.batch
                          ?.batchNumber || "-"}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            movement.type === "IN"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {movement.type === "IN"
                            ? "Stock In"
                            : "Stock Out"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {movement.type === "IN"
                          ? "+"
                          : "-"}
                        {movement.quantity}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {movement.reason || "-"}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {movement.reference || "-"}
                      </td>

                      <td className="max-w-xs px-4 py-4 text-gray-600">
                        {movement.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

