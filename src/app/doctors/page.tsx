

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Doctor {
  _id: string;
  doctorName: string;
  specialization?: string;
  phone?: string;
  email?: string;
  qualification?: string;
  registrationNumber?: string;
  consultationFee?: number;
  chamber?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/doctors", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch doctors"
        );
      }

      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Fetch doctors error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch doctors"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return doctors;

    return doctors.filter((doctor) => {
      return (
        doctor.doctorName
          ?.toLowerCase()
          .includes(keyword) ||
        doctor.specialization
          ?.toLowerCase()
          .includes(keyword) ||
        doctor.phone
          ?.toLowerCase()
          .includes(keyword) ||
        doctor.chamber
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [doctors, search]);

  const confirmDeactivate = (doctor: Doctor) => {
    toast.custom(
      (toastId) => (
        <div className="w-[380px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Deactivate Doctor?
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold">
                  {doctor.doctorName}
                </span>
                ?
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.dismiss(toastId)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={async () => {
                toast.dismiss(toastId);
                await deactivateDoctor(doctor._id);
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Deactivate
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      }
    );
  };

  const deactivateDoctor = async (id: string) => {
    try {
      setDeletingId(id);

      const response = await fetch(`/api/doctors/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to deactivate doctor"
        );
      }

      setDoctors((current) =>
        current.filter((doctor) => doctor._id !== id)
      );

      toast.success(
        data.message || "Doctor deactivated successfully"
      );
    } catch (error) {
      console.error("Deactivate doctor error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to deactivate doctor"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Doctors
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage doctors and their visiting information
          </p>
        </div>

        <Link
          href="/doctors/create"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>

          Add Doctor
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialization, phone or chamber..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            Loading doctors...
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <h3 className="font-semibold text-gray-900">
              No doctors found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add your first doctor to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Doctor
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Specialization
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Chamber
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Consultation
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredDoctors.map((doctor) => (
                  <tr
                    key={doctor._id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {doctor.doctorName}
                        </p>

                        {doctor.qualification && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {doctor.qualification}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {doctor.specialization || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {doctor.phone || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {doctor.chamber || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹
                      {Number(
                        doctor.consultationFee || 0
                      ).toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/doctors/${doctor._id}/edit`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            confirmDeactivate(doctor)
                          }
                          disabled={
                            deletingId === doctor._id
                          }
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === doctor._id
                            ? "..."
                            : "Deactivate"}
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

