

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Edit,
  Loader2,
  Plus,
  Search,
  Truck,
  UserRound,
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
  createdAt?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deactivatingId, setDeactivatingId] = useState<string | null>(
    null
  );

  async function fetchSuppliers() {
    try {
      setLoading(true);

      const response = await fetch("/api/suppliers");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch suppliers");
      }

      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);

      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function handleDeactivate(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this supplier?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingId(id);

      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to deactivate supplier"
        );
      }

      toast.success("Supplier deactivated successfully");

      await fetchSuppliers();
    } catch (error) {
      console.error("Failed to deactivate supplier:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to deactivate supplier"
      );
    } finally {
      setDeactivatingId(null);
    }
  }

  const filteredSuppliers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return suppliers;
    }

    return suppliers.filter((supplier) => {
      return [
        supplier.supplierName,
        supplier.companyName,
        supplier.phone,
        supplier.email,
        supplier.gstin,
        supplier.contactPerson,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchText)
        );
    });
  }, [suppliers, search]);

  const activeCount = suppliers.filter(
    (supplier) => supplier.isActive
  ).length;

  const inactiveCount = suppliers.filter(
    (supplier) => !supplier.isActive
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6" />

            <h1 className="text-2xl font-semibold tracking-tight">
              Suppliers
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your medicine suppliers and supplier information.
          </p>
        </div>

        <Link
          href="/suppliers/create"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/85"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </Link>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Suppliers
            </p>

            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {suppliers.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Active Suppliers
            </p>

            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {activeCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Inactive Suppliers
            </p>

            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-xl border bg-white">
        {/* Search */}
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search suppliers..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading suppliers...
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          /* Empty State */
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Truck className="h-6 w-6 text-muted-foreground" />
            </div>

            <h2 className="mt-4 text-base font-semibold">
              {search
                ? "No suppliers found"
                : "No suppliers yet"}
            </h2>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Add your first medicine supplier to get started."}
            </p>

            {!search && (
              <Link
                href="/suppliers/create"
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-black px-3 text-sm font-medium text-white hover:bg-black/85"
              >
                <Plus className="h-4 w-4" />
                Add Supplier
              </Link>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-5 py-3 font-medium">
                    Supplier
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Contact
                  </th>

                  <th className="px-5 py-3 font-medium">
                    GSTIN
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Payment Terms
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier._id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    {/* Supplier */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium">
                            {supplier.supplierName}
                          </p>

                          {supplier.companyName && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {supplier.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        {supplier.contactPerson && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {supplier.contactPerson}
                            </span>
                          </div>
                        )}

                        {supplier.phone ? (
                          <p className="text-xs text-muted-foreground">
                            {supplier.phone}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            —
                          </p>
                        )}

                        {supplier.email && (
                          <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                            {supplier.email}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* GSTIN */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs">
                        {supplier.gstin || "—"}
                      </span>
                    </td>

                    {/* Payment Terms */}
                    <td className="px-5 py-4 text-muted-foreground">
                      {supplier.paymentTerms || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {supplier.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/suppliers/${supplier._id}/edit`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors hover:bg-muted"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Link>

                        {supplier.isActive && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeactivate(supplier._id)
                            }
                            disabled={
                              deactivatingId === supplier._id
                            }
                            className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deactivatingId === supplier._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Deactivate"
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

