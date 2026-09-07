
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type MedicineFormData = {
  name: string;
  genericName: string;
  company: string;
  category: string;
  strength: string;
  dosageForm: string;
  rack: string;
  minimumStock: string;
  purchasePrice: string;
  sellingPrice: string;
  taxRate: string;
};

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [formData, setFormData] = useState<MedicineFormData>({
    name: "",
    genericName: "",
    company: "",
    category: "",
    strength: "",
    dosageForm: "",
    rack: "",
    minimumStock: "10",
    purchasePrice: "",
    sellingPrice: "",
    taxRate: "0",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/medicines/${id}`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch medicine");
        }

        const medicine = data.medicine;

        setFormData({
          name: medicine.name || "",
          genericName: medicine.genericName || "",
          company: medicine.company || "",
          category: medicine.category || "",
          strength: medicine.strength || "",
          dosageForm: medicine.dosageForm || "",
          rack: medicine.rack || "",
          minimumStock: String(medicine.minimumStock ?? 10),
          purchasePrice: String(medicine.purchasePrice ?? ""),
          sellingPrice: String(medicine.sellingPrice ?? ""),
          taxRate: String(medicine.taxRate ?? 0),
        });
      } catch (error) {
        console.error("Fetch medicine error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch medicine"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMedicine();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Medicine name is required.");
      return;
    }

    if (formData.purchasePrice === "") {
      setError("Purchase price is required.");
      return;
    }

    if (formData.sellingPrice === "") {
      setError("Selling price is required.");
      return;
    }

    if (Number(formData.purchasePrice) < 0) {
      setError("Purchase price cannot be negative.");
      return;
    }

    if (Number(formData.sellingPrice) < 0) {
      setError("Selling price cannot be negative.");
      return;
    }

    if (Number(formData.minimumStock) < 0) {
      setError("Minimum stock cannot be negative.");
      return;
    }

    if (Number(formData.taxRate) < 0) {
      setError("Tax rate cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/medicines/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          genericName: formData.genericName.trim(),
          company: formData.company.trim(),
          category: formData.category.trim(),
          strength: formData.strength.trim(),
          dosageForm: formData.dosageForm.trim(),
          rack: formData.rack.trim(),
          minimumStock: Number(formData.minimumStock),
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
          taxRate: Number(formData.taxRate),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update medicine");
      }

      router.push("/medicines");
      router.refresh();
    } catch (error) {
      console.error("Update medicine error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update medicine"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading medicine...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/medicines"
            className="text-sm font-medium text-gray-900 hover:text-gray-600"
          >
            ← Back to Medicines
          </Link>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
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
          <Link
            href="/medicines"
            className="text-sm font-medium text-gray-900 hover:text-gray-600"
          >
            ← Back to Medicines
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Edit Medicine
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update the medicine information in your pharmacy inventory.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Medicine Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Medicine Name{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Napa"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Generic Name */}
              <div>
                <label
                  htmlFor="genericName"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Generic Name
                </label>

                <input
                  id="genericName"
                  name="genericName"
                  type="text"
                  value={formData.genericName}
                  onChange={handleChange}
                  placeholder="e.g. Paracetamol"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Company */}
              <div>
                <label
                  htmlFor="company"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Company
                </label>

                <input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Beximco"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <input
                  id="category"
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Antibiotic"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Strength */}
              <div>
                <label
                  htmlFor="strength"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Strength
                </label>

                <input
                  id="strength"
                  name="strength"
                  type="text"
                  value={formData.strength}
                  onChange={handleChange}
                  placeholder="e.g. 500mg"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Dosage Form */}
              <div>
                <label
                  htmlFor="dosageForm"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Dosage Form
                </label>

                <select
                  id="dosageForm"
                  name="dosageForm"
                  value={formData.dosageForm}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">Select dosage form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Powder">Powder</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Storage
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Rack */}
              <div>
                <label
                  htmlFor="rack"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Rack / Shelf
                </label>

                <input
                  id="rack"
                  name="rack"
                  type="text"
                  value={formData.rack}
                  onChange={handleChange}
                  placeholder="e.g. R1-S2"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Minimum Stock */}
              <div>
                <label
                  htmlFor="minimumStock"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Minimum Stock
                </label>

                <input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Low-stock alert will be based on this value.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Pricing
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* Purchase Price */}
              <div>
                <label
                  htmlFor="purchasePrice"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Purchase Price{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label
                  htmlFor="sellingPrice"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Selling Price{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="sellingPrice"
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label
                  htmlFor="taxRate"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Tax Rate (%)
                </label>

                <input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/medicines"
              className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving ? "Updating..." : "Update Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

