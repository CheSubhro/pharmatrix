

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  UserRound,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

interface Customer {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  notes?: string;
  isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/customers");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch customers"
        );
      }

      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      customer.customerName
        .toLowerCase()
        .includes(searchText) ||
      customer.phone
        .toLowerCase()
        .includes(searchText) ||
      customer.email
        ?.toLowerCase()
        .includes(searchText) ||
      customer.address
        ?.toLowerCase()
        .includes(searchText)
    );
  });


    const handleDeactivate = (id: string, customerName: string) => {
    toast.warning(`Deactivate "${customerName}"?`, {
        description: "This customer will be removed from the active customer list.",
        duration: 10000,
        action: {
        label: "Deactivate",
        onClick: async () => {
            try {
            const response = await fetch(`/api/customers/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                data.message || "Failed to deactivate customer"
                );
            }

            toast.success("Customer deactivated successfully");

            fetchCustomers();
            } catch (error) {
            console.error(error);

            toast.error(
                error instanceof Error
                ? error.message
                : "Failed to deactivate customer"
            );
            }
        },
        },
        cancel: {
        label: "Cancel",
        onClick: () => {
            toast.dismiss();
        },
        },
    });
    };



  const formatDate = (date?: string) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage pharmacy customers and their basic information
          </p>
        </div>

        <Link
          href="/customers/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, phone, email or address..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Total Customers
          </div>

          <div className="mt-2 text-2xl font-bold text-gray-900">
            {customers.length}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Search Results
          </div>

          <div className="mt-2 text-2xl font-bold text-gray-900">
            {filteredCustomers.length}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Active Customers
          </div>

          <div className="mt-2 text-2xl font-bold text-gray-900">
            {customers.filter(
              (customer) => customer.isActive
            ).length}
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Customer List
          </h2>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <p className="text-sm text-gray-500">
              Loading customers...
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-5 text-center">
            <UserRound className="h-10 w-10 text-gray-300" />

            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              No customers found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add your first customer to get started.
            </p>

            <Link
              href="/customers/create"
              className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Customer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Gender
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date of Birth
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Address
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                          <UserRound className="h-4 w-4 text-gray-600" />
                        </div>

                        <div>
                          <div className="font-semibold text-gray-900">
                            {customer.customerName}
                          </div>

                          {customer.notes && (
                            <div className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
                              {customer.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {customer.email ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {customer.email}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {customer.gender || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(customer.dateOfBirth)}
                    </td>

                    <td className="px-5 py-4">
                      {customer.address ? (
                        <div className="flex max-w-[220px] items-start gap-2 text-gray-600">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />

                          <span className="truncate">
                            {customer.address}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/customers/${customer._id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>

                        <button
                          type="button"
                            onClick={() =>
                                handleDeactivate(customer._id, customer.customerName)
                            }
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Deactivate
                        </button>
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

