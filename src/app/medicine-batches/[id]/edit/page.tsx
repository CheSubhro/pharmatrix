
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  strength?: string;
  dosageForm?: string;
}

interface MedicineBatch {
  _id: string;
  medicine: Medicine;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  initialStock: number;
  currentStock: number;
  isActive: boolean;
}

export default function EditMedicineBatchPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batch, setBatch] = useState<MedicineBatch | null>(null);

  const [medicine, setMedicine] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [initialStock, setInitialStock] = useState("");

  const [currentStock, setCurrentStock] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [batchResponse, medicinesResponse] =
          await Promise.all([
            fetch(`/api/medicine-batches/${id}`),
            fetch("/api/medicines"),
          ]);

        const batchData = await batchResponse.json();
        const medicinesData = await medicinesResponse.json();

        if (
          !batchResponse.ok ||
          !batchData.success
        ) {
          throw new Error(
            batchData.message ||
              "Failed to fetch medicine batch"
          );
        }

        if (
          !medicinesResponse.ok ||
          !medicinesData.success
        ) {
          throw new Error(
            medicinesData.message ||
              "Failed to fetch medicines"
          );
        }

        const fetchedBatch: MedicineBatch =
          batchData.batch;

        setBatch(fetchedBatch);
        setMedicines(medicinesData.medicines || []);

        setMedicine(
          fetchedBatch.medicine?._id || ""
        );

        setBatchNumber(
          fetchedBatch.batchNumber || ""
        );

        setManufacturingDate(
          fetchedBatch.manufacturingDate
            ? fetchedBatch.manufacturingDate.substring(0, 10)
            : ""
        );

        setExpiryDate(
          fetchedBatch.expiryDate
            ? fetchedBatch.expiryDate.substring(0, 10)
            : ""
        );

        setInitialStock(
          String(fetchedBatch.initialStock ?? "")
        );

        setCurrentStock(
          fetchedBatch.currentStock ?? 0
        );
      } catch (error) {
        console.error(
          "Fetch edit batch data error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load medicine batch"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!medicine) {
      toast.error("Please select a medicine");
      return;
    }

    if (!batchNumber.trim()) {
      toast.error("Batch number is required");
      return;
    }

    if (!expiryDate) {
      toast.error("Expiry date is required");
      return;
    }

    if (initialStock === "") {
      toast.error("Initial stock is required");
      return;
    }

    const stock = Number(initialStock);

    if (!Number.isFinite(stock) || stock < 0) {
      toast.error(
        "Initial stock must be 0 or greater"
      );
      return;
    }

    if (manufacturingDate && expiryDate) {
      const manufacturing = new Date(
        manufacturingDate
      );

      const expiry = new Date(expiryDate);

      if (manufacturing > expiry) {
        toast.error(
          "Manufacturing date cannot be after expiry date"
        );
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/medicine-batches/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicine,
            batchNumber: batchNumber.trim(),
            manufacturingDate:
              manufacturingDate || undefined,
            expiryDate,
            initialStock: stock,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update medicine batch"
        );
      }

      toast.success(
        "Medicine batch updated successfully"
      );

      router.push("/medicine-batches");
    } catch (error) {
      console.error(
        "Update batch error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update medicine batch";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading medicine batch...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/medicine-batches"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              ← Back to Medicine Batches
            </Link>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Medicine batch not found
            </h2>

            <Link
              href="/medicine-batches"
              className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Batches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-3">
            <Link
              href="/medicine-batches"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              ← Back to Medicine Batches
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Edit Medicine Batch
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update batch information and expiry details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Medicine Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Medicine Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select the medicine associated with this batch.
              </p>
            </div>

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
                value={medicine}
                onChange={(event) =>
                  setMedicine(event.target.value)
                }
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  Select a medicine
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
          </div>

          {/* Batch Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Batch Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update the batch number and dates.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Batch Number */}
              <div className="md:col-span-2">
                <label
                  htmlFor="batchNumber"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Batch Number{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="batchNumber"
                  type="text"
                  value={batchNumber}
                  onChange={(event) =>
                    setBatchNumber(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>

              {/* Manufacturing Date */}
              <div>
                <label
                  htmlFor="manufacturingDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Manufacturing Date
                </label>

                <input
                  id="manufacturingDate"
                  type="date"
                  value={manufacturingDate}
                  onChange={(event) =>
                    setManufacturingDate(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label
                  htmlFor="expiryDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Expiry Date{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(event) =>
                    setExpiryDate(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Stock Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Initial stock can be updated, but current stock is
                controlled by stock movements.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Initial Stock */}
              <div>
                <label
                  htmlFor="initialStock"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Initial Stock{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="initialStock"
                  type="number"
                  min="0"
                  step="1"
                  value={initialStock}
                  onChange={(event) =>
                    setInitialStock(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>

              {/* Current Stock */}
              <div>
                <label
                  htmlFor="currentStock"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Current Stock
                </label>

                <input
                  id="currentStock"
                  type="number"
                  value={currentStock}
                  disabled
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-600 outline-none"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Current stock cannot be edited here.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/medicine-batches"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

