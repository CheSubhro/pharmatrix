

"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateSupplierPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: "",
    companyName: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    contactPerson: "",
    paymentTerms: "",
  });

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.supplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create supplier"
        );
      }

      toast.success("Supplier created successfully");

      router.push("/suppliers");
    } catch (error) {
      console.error("Create supplier error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create supplier"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/suppliers"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suppliers
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
            <Truck className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Add Supplier
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Add a new medicine supplier to your pharmacy.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-xl border bg-white">
          {/* Basic Information */}
          <div className="border-b px-6 py-5">
            <h2 className="text-base font-semibold">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Enter the supplier's basic business information.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {/* Supplier Name */}
            <div>
              <label
                htmlFor="supplierName"
                className="mb-2 block text-sm font-medium"
              >
                Supplier Name <span className="text-red-500">*</span>
              </label>

              <input
                id="supplierName"
                name="supplierName"
                type="text"
                value={formData.supplierName}
                onChange={handleChange}
                placeholder="Enter supplier name"
                required
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Company Name */}
            <div>
              <label
                htmlFor="companyName"
                className="mb-2 block text-sm font-medium"
              >
                Company Name
              </label>

              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label
                htmlFor="contactPerson"
                className="mb-2 block text-sm font-medium"
              >
                Contact Person
              </label>

              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="Enter contact person name"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* GSTIN */}
            <div>
              <label
                htmlFor="gstin"
                className="mb-2 block text-sm font-medium"
              >
                GSTIN
              </label>

              <input
                id="gstin"
                name="gstin"
                type="text"
                value={formData.gstin}
                onChange={handleChange}
                placeholder="Enter GSTIN"
                maxLength={15}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm uppercase outline-none transition focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label
                htmlFor="paymentTerms"
                className="mb-2 block text-sm font-medium"
              >
                Payment Terms
              </label>

              <select
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              >
                <option value="">Select payment terms</option>
                <option value="Cash">Cash</option>
                <option value="Due">Due</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="45 Days">45 Days</option>
                <option value="60 Days">60 Days</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium"
              >
                Address
              </label>

              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter supplier address"
                rows={4}
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
            <Link
              href="/suppliers"
              className="inline-flex h-10 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Supplier
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

