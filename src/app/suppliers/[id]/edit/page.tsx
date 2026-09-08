

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

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

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();

  const supplierId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: "",
    companyName: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    contactPerson: "",
    paymentTerms: "",
    isActive: true,
  });

  useEffect(() => {
    async function fetchSupplier() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/suppliers/${supplierId}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch supplier"
          );
        }

        const supplier: Supplier = data.supplier;

        setFormData({
          supplierName: supplier.supplierName || "",
          companyName: supplier.companyName || "",
          phone: supplier.phone || "",
          email: supplier.email || "",
          address: supplier.address || "",
          gstin: supplier.gstin || "",
          contactPerson: supplier.contactPerson || "",
          paymentTerms: supplier.paymentTerms || "",
          isActive: supplier.isActive,
        });
      } catch (error) {
        console.error("Fetch supplier error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load supplier"
        );
      } finally {
        setLoading(false);
      }
    }

    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId]);

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

  function handleStatusChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    setFormData((prev) => ({
      ...prev,
      isActive: event.target.value === "true",
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formData.supplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/suppliers/${supplierId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update supplier"
        );
      }

      toast.success("Supplier updated successfully");

      router.push("/suppliers");
    } catch (error) {
      console.error("Update supplier error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update supplier"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading supplier...
        </div>
      </div>
    );
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
              Edit Supplier
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Update supplier information.
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
              Supplier Information
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Update the supplier's business and contact details.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {/* Supplier Name */}
            <div>
              <label
                htmlFor="supplierName"
                className="mb-2 block text-sm font-medium"
              >
                Supplier Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="supplierName"
                name="supplierName"
                type="text"
                value={formData.supplierName}
                onChange={handleChange}
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
                placeholder="Enter contact person"
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

            {/* Status */}
            <div>
              <label
                htmlFor="isActive"
                className="mb-2 block text-sm font-medium"
              >
                Status
              </label>

              <select
                id="isActive"
                value={formData.isActive ? "true" : "false"}
                onChange={handleStatusChange}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

