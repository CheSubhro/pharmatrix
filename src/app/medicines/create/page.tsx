

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Category {
  _id: string;
  name: string;
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
    minimumStock: "10",
    purchasePrice: "",
    sellingPrice: "",
    taxRate: "0",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

    if (!formData.name.trim()) {
      alert("Medicine name is required.");
      return;
    }

    if (!formData.purchasePrice) {
      alert("Purchase price is required.");
      return;
    }

    if (!formData.sellingPrice) {
      alert("Selling price is required.");
      return;
    }

    if (
      Number(formData.minimumStock) < 0 ||
      Number(formData.purchasePrice) < 0 ||
      Number(formData.sellingPrice) < 0 ||
      Number(formData.taxRate) < 0
    ) {
      alert("Numeric values cannot be negative.");
      return;
    }

    try {
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
          dosageForm: formData.dosageForm,
          rack: formData.rack.trim(),
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

      router.push("/medicines");
      router.refresh();
    } catch (error) {
      console.error("Create medicine error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create medicine"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Add Medicine
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Add a new medicine to your inventory.
            </p>
          </div>

          <Link
            href="/medicines"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Back to Medicines
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Medicine Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Medicine Name *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Paracetamol 500"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

            {/* Rack */}
            <div>
              <label
                htmlFor="rack"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Rack
              </label>

              <input
                id="rack"
                name="rack"
                type="text"
                value={formData.rack}
                onChange={handleChange}
                placeholder="e.g. Rack A1"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label
                htmlFor="purchasePrice"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Purchase Price *
              </label>

              <input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="e.g. 20.00"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label
                htmlFor="sellingPrice"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Selling Price *
              </label>

              <input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="e.g. 25.00"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                placeholder="e.g. 5"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Link
              href="/medicines"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Add Medicine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

