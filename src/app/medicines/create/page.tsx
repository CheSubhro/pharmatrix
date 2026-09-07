

"use client";

import { FormEvent, useEffect, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
}

interface Rack {
  _id: string;
  name: string;
  code: string;
  shelves: string[];
}

export default function CreateMedicinePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    company: "",
    category: "",
    strength: "",
    dosageForm: "",
    rack: "",
    shelf: "",
    minimumStock: "10",
    purchasePrice: "",
    sellingPrice: "",
    taxRate: "0",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [racksLoading, setRacksLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch categories"
          );
        }

        setCategories(data.categories || []);
      } catch (error) {
        console.error("Fetch categories error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch categories"
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchRacks = async () => {
      try {
        const response = await fetch("/api/racks");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch racks"
          );
        }

        setRacks(data.racks || []);
      } catch (error) {
        console.error("Fetch racks error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch racks"
        );
      } finally {
        setRacksLoading(false);
      }
    };

    fetchRacks();
  }, []);

  const selectedRack = racks.find(
    (rack) => rack._id === formData.rack
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "rack") {
      setFormData((prev) => ({
        ...prev,
        rack: value,
        shelf: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Medicine name is required.");
      return;
    }

    if (formData.purchasePrice === "") {
      toast.error("Purchase price is required.");
      return;
    }

    if (formData.sellingPrice === "") {
      toast.error("Selling price is required.");
      return;
    }

    if (Number(formData.purchasePrice) < 0) {
      toast.error("Purchase price cannot be negative.");
      return;
    }

    if (Number(formData.sellingPrice) < 0) {
      toast.error("Selling price cannot be negative.");
      return;
    }

    if (Number(formData.minimumStock) < 0) {
      toast.error("Minimum stock cannot be negative.");
      return;
    }

    if (Number(formData.taxRate) < 0) {
      toast.error("Tax rate cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/medicines", {
        method: "POST",
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
          shelf: formData.shelf.trim(),
          minimumStock: Number(formData.minimumStock),
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
          taxRate: Number(formData.taxRate),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create medicine"
        );
      }

      toast.success("Medicine added successfully");

      router.push("/medicines");
      router.refresh();
    } catch (error) {
      console.error("Create medicine error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create medicine"
      );
    } finally {
      setSaving(false);
    }
  };

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
            Add Medicine
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add a new medicine to your pharmacy inventory.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
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
                  placeholder="e.g. Paracetamol 500"
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
                  placeholder="e.g. Sun Pharma"
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

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
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
                  <option value="">
                    Select dosage form
                  </option>
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
                  Rack
                </label>

                <select
                  id="rack"
                  name="rack"
                  value={formData.rack}
                  onChange={handleChange}
                  disabled={racksLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {racksLoading
                      ? "Loading racks..."
                      : "Select rack"}
                  </option>

                  {racks.map((rack) => (
                    <option
                      key={rack._id}
                      value={rack._id}
                    >
                      {rack.name} ({rack.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shelf */}
              <div>
                <label
                  htmlFor="shelf"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Shelf
                </label>

                <select
                  id="shelf"
                  name="shelf"
                  value={formData.shelf}
                  onChange={handleChange}
                  disabled={
                    !selectedRack ||
                    selectedRack.shelves.length === 0
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {!selectedRack
                      ? "Select rack first"
                      : selectedRack.shelves.length === 0
                        ? "No shelves available"
                        : "Select shelf"}
                  </option>

                  {selectedRack?.shelves.map((shelf) => (
                    <option key={shelf} value={shelf}>
                      {shelf}
                    </option>
                  ))}
                </select>
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
                  placeholder="e.g. 10"
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
              {saving ? "Adding..." : "Add Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

