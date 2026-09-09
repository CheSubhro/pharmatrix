

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  User,
  IndianRupee,
  Plus,
  Eye,
  Trash2,
  Upload,
  X,
} from "lucide-react";

interface Customer {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
}

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
  batchNumber?: string;
  expiryDate?: string;
}

interface SaleItem {
  medicine: Medicine;
  medicineName: string;
  genericName?: string;
  batch?: Batch;
  batchNumber?: string;
  quantity: number;
  sellingPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

interface Purchase {
  _id: string;
  billNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";
  saleDate: string;
  status: string;
}

interface Summary {
  totalBills: number;
  totalPurchaseAmount: number;
  totalItems: number;
  latestPurchaseDate: string | null;
}

interface Prescription {
  _id: string;
  customer: string;
  doctorName: string;
  prescriptionDate: string;
  fileUrl?: string;
  filePublicId?: string;
  fileType?: "IMAGE" | "PDF";
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse {
  success: boolean;
  customer: Customer;
  summary: Summary;
  purchases: Purchase[];
  message?: string;
}

interface PrescriptionApiResponse {
  success: boolean;
  prescriptions?: Prescription[];
  prescription?: Prescription;
  message?: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CustomerDetailsPage({
  params,
}: PageProps) {
  const [customerId, setCustomerId] = useState<string | null>(
    null
  );

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prescription states
  const [prescriptions, setPrescriptions] = useState<
    Prescription[]
  >([]);

  const [prescriptionLoading, setPrescriptionLoading] =
    useState(false);

  const [showPrescriptionForm, setShowPrescriptionForm] =
    useState(false);

  const [savingPrescription, setSavingPrescription] =
    useState(false);

  const [deletingPrescription, setDeletingPrescription] =
    useState<string | null>(null);

  const [doctorName, setDoctorName] = useState("");
  const [prescriptionDate, setPrescriptionDate] =
    useState("");

  const [prescriptionFile, setPrescriptionFile] =
    useState<File | null>(null);

  const [prescriptionNotes, setPrescriptionNotes] =
    useState("");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCustomerId(resolvedParams.id);
    };

    loadParams();
  }, [params]);

  // Fetch customer purchase history
  useEffect(() => {
    if (!customerId) return;

    const fetchPurchaseHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/customers/${customerId}/purchases`
        );

        const data: ApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to fetch customer purchase history"
          );
        }

        setCustomer(data.customer);
        setSummary(data.summary);
        setPurchases(data.purchases);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load customer purchase history"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseHistory();
  }, [customerId]);

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    if (!customerId) return;

    try {
      setPrescriptionLoading(true);

      const response = await fetch(
        `/api/customers/${customerId}/prescriptions`
      );

      const data: PrescriptionApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch prescriptions"
        );
      }

      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error(
        "Failed to fetch prescriptions:",
        error
      );
    } finally {
      setPrescriptionLoading(false);
    }
  };

  useEffect(() => {
    if (!customerId) return;

    fetchPrescriptions();
  }, [customerId]);

  const formatDate = (date?: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPaymentBadgeClass = (
    paymentMethod: Purchase["paymentMethod"]
  ) => {
    switch (paymentMethod) {
      case "CASH":
        return "bg-green-50 text-green-700 border-green-200";

      case "UPI":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "CARD":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "CREDIT":
        return "bg-orange-50 text-orange-700 border-orange-200";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Add prescription
  const handleAddPrescription = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!customerId) return;

    if (!doctorName.trim()) {
      alert("Doctor name is required");
      return;
    }

    if (!prescriptionDate) {
      alert("Prescription date is required");
      return;
    }

    try {
      setSavingPrescription(true);

      const formData = new FormData();

      formData.append(
        "doctorName",
        doctorName.trim()
      );

      formData.append(
        "prescriptionDate",
        prescriptionDate
      );

      if (prescriptionNotes.trim()) {
        formData.append(
          "notes",
          prescriptionNotes.trim()
        );
      }

      if (prescriptionFile) {
        formData.append(
          "file",
          prescriptionFile
        );
      }

      const response = await fetch(
        `/api/customers/${customerId}/prescriptions`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data: PrescriptionApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to add prescription"
        );
      }

      // Reset form
      setDoctorName("");
      setPrescriptionDate("");
      setPrescriptionFile(null);
      setPrescriptionNotes("");
      setShowPrescriptionForm(false);

      // Refresh prescriptions
      await fetchPrescriptions();

      alert("Prescription added successfully");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to add prescription"
      );
    } finally {
      setSavingPrescription(false);
    }
  };

  // Delete prescription
  const handleDeletePrescription = async (
    prescriptionId: string
  ) => {
    if (!customerId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this prescription?"
    );

    if (!confirmed) return;

    try {
      setDeletingPrescription(prescriptionId);

      const response = await fetch(
        `/api/customers/${customerId}/prescriptions?prescriptionId=${prescriptionId}`,
        {
          method: "DELETE",
        }
      );

      const data: PrescriptionApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete prescription"
        );
      }

      setPrescriptions((current) =>
        current.filter(
          (item) => item._id !== prescriptionId
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete prescription"
      );
    } finally {
      setDeletingPrescription(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />

            <p className="text-sm text-gray-500">
              Loading customer details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer || !summary) {
    return (
      <div className="p-6">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>

        <div className="border border-red-200 bg-red-50 rounded-xl p-6">
          <h2 className="font-semibold text-red-800">
            Failed to load customer
          </h2>

          <p className="text-sm text-red-600 mt-1">
            {error || "Customer not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-3"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>

          <h1 className="text-2xl font-semibold text-gray-900">
            Customer Details
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Customer profile and purchase history
          </p>
        </div>

        <Link
          href={`/customers/${customer._id}/edit`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
        >
          <User size={16} />
          Edit Customer
        </Link>
      </div>

      {/* Customer Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <User size={28} className="text-gray-600" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {customer.customerName}
            </h2>

            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} />
                <span>{customer.phone}</span>
              </div>

              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={16} />
                  <span>{customer.email}</span>
                </div>
              )}

              {customer.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Bills
              </p>

              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {summary.totalBills}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText
                size={20}
                className="text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Purchase
              </p>

              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {formatCurrency(
                  summary.totalPurchaseAmount
                )}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <IndianRupee
                size={20}
                className="text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Items
              </p>

              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {summary.totalItems}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <ShoppingCart
                size={20}
                className="text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Last Purchase
              </p>

              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatDate(summary.latestPurchaseDate)}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <CalendarDays
                size={20}
                className="text-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Prescriptions
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Prescription records for this customer
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowPrescriptionForm(
                  (current) => !current
                )
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
            >
              {showPrescriptionForm ? (
                <>
                  <X size={16} />
                  Close
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Prescription
                </>
              )}
            </button>
          </div>
        </div>

        {/* Add Prescription Form */}
        {showPrescriptionForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <form
              onSubmit={handleAddPrescription}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Doctor Name
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={doctorName}
                    onChange={(event) =>
                      setDoctorName(event.target.value)
                    }
                    placeholder="Enter doctor name"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prescription Date
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    value={prescriptionDate}
                    onChange={(event) =>
                      setPrescriptionDate(
                        event.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prescription File
                </label>

                <div className="border border-dashed border-gray-300 rounded-lg bg-white p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition">
                      <Upload size={16} />

                      Choose File

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) =>
                          setPrescriptionFile(
                            event.target.files?.[0] ||
                              null
                          )
                        }
                        className="hidden"
                      />
                    </label>

                    {prescriptionFile ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText size={16} />

                        <span className="truncate max-w-[280px]">
                          {prescriptionFile.name}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setPrescriptionFile(null)
                          }
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        JPG, PNG, WEBP or PDF — maximum
                        10 MB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>

                <textarea
                  value={prescriptionNotes}
                  onChange={(event) =>
                    setPrescriptionNotes(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Add prescription notes..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrescriptionForm(false);
                    setDoctorName("");
                    setPrescriptionDate("");
                    setPrescriptionFile(null);
                    setPrescriptionNotes("");
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPrescription}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {savingPrescription ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Save Prescription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Prescription List */}
        {prescriptionLoading ? (
          <div className="py-12 text-center">
            <div className="w-7 h-7 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3" />

            <p className="text-sm text-gray-500">
              Loading prescriptions...
            </p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText
                size={22}
                className="text-gray-500"
              />
            </div>

            <h3 className="font-medium text-gray-900">
              No prescriptions
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              No prescription records have been added
              for this customer yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {prescriptions.map((prescription) => (
              <div
                key={prescription._id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <FileText
                        size={20}
                        className="text-gray-600"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {prescription.doctorName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <CalendarDays size={15} />
                          {formatDate(
                            prescription.prescriptionDate
                          )}
                        </div>

                        {prescription.fileType && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600">
                            {prescription.fileType}
                          </span>
                        )}
                      </div>

                      {prescription.notes && (
                        <p className="text-sm text-gray-600 mt-3">
                          {prescription.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {prescription.fileUrl && (
                      <a
                        href={prescription.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:text-black transition"
                      >
                        <Eye size={16} />
                        View
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleDeletePrescription(
                          prescription._id
                        )
                      }
                      disabled={
                        deletingPrescription ===
                        prescription._id
                      }
                      className="inline-flex items-center gap-2 px-3.5 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                    >
                      <Trash2 size={16} />

                      {deletingPrescription ===
                      prescription._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase History */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Purchase History
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                All completed bills for this customer
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {purchases.length}{" "}
              {purchases.length === 1
                ? "Bill"
                : "Bills"}
            </span>
          </div>
        </div>

        {purchases.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingCart
                size={22}
                className="text-gray-500"
              />
            </div>

            <h3 className="font-medium text-gray-900">
              No purchase history
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              This customer has no completed purchases
              yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <div
                key={purchase._id}
                className="p-6 hover:bg-gray-50 transition"
              >
                {/* Bill Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {purchase.billNumber}
                      </h3>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getPaymentBadgeClass(
                          purchase.paymentMethod
                        )}`}
                      >
                        {purchase.paymentMethod}
                      </span>

                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                        {purchase.paymentStatus}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                      {formatDateTime(
                        purchase.saleDate
                      )}
                    </p>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-sm text-gray-500">
                      Bill Total
                    </p>

                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(
                        purchase.grandTotal
                      )}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide grid grid-cols-12 gap-3">
                    <div className="col-span-5">
                      Medicine
                    </div>

                    <div className="col-span-2">
                      Batch
                    </div>

                    <div className="col-span-1 text-center">
                      Qty
                    </div>

                    <div className="col-span-2 text-right">
                      Price
                    </div>

                    <div className="col-span-2 text-right">
                      Total
                    </div>
                  </div>

                  {purchase.items.map(
                    (item, index) => (
                      <div
                        key={`${purchase._id}-${index}`}
                        className="px-4 py-3 border-t border-gray-200 grid grid-cols-12 gap-3 items-center"
                      >
                        <div className="col-span-5">
                          <p className="text-sm font-medium text-gray-900">
                            {item.medicineName ||
                              item.medicine?.name ||
                              "-"}
                          </p>

                          {(item.genericName ||
                            item.medicine
                              ?.genericName) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.genericName ||
                                item.medicine
                                  ?.genericName}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2 text-sm text-gray-600">
                          {item.batchNumber ||
                            item.batch?.batchNumber ||
                            "-"}
                        </div>

                        <div className="col-span-1 text-center text-sm text-gray-700">
                          {item.quantity}
                        </div>

                        <div className="col-span-2 text-right text-sm text-gray-700">
                          {formatCurrency(
                            item.sellingPrice
                          )}
                        </div>

                        <div className="col-span-2 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Bill Summary */}
                <div className="flex justify-end mt-4">
                  <div className="w-full sm:w-72 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>

                      <span>
                        {formatCurrency(
                          purchase.subtotal
                        )}
                      </span>
                    </div>

                    {purchase.discount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Discount</span>

                        <span>
                          -
                          {formatCurrency(
                            purchase.discount
                          )}
                        </span>
                      </div>
                    )}

                    {purchase.tax > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax / GST</span>

                        <span>
                          {formatCurrency(
                            purchase.tax
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-gray-900">
                      <span>Grand Total</span>

                      <span>
                        {formatCurrency(
                          purchase.grandTotal
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

