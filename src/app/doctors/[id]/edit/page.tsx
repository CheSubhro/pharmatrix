

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
}

export default function EditDoctorPage() {
  const params = useParams();
  const router = useRouter();

  const doctorId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [doctorName, setDoctorName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [qualification, setQualification] = useState("");
  const [registrationNumber, setRegistrationNumber] =
    useState("");
  const [consultationFee, setConsultationFee] =
    useState("0");
  const [chamber, setChamber] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctor = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/doctors/${doctorId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch doctor"
          );
        }

        const doctor: Doctor = data.doctor;

        setDoctorName(doctor.doctorName || "");
        setSpecialization(
          doctor.specialization || ""
        );
        setPhone(doctor.phone || "");
        setEmail(doctor.email || "");
        setQualification(
          doctor.qualification || ""
        );
        setRegistrationNumber(
          doctor.registrationNumber || ""
        );
        setConsultationFee(
          String(doctor.consultationFee ?? 0)
        );
        setChamber(doctor.chamber || "");
        setNotes(doctor.notes || "");
        setIsActive(doctor.isActive);
      } catch (error) {
        console.error("Fetch doctor error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch doctor"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!doctorName.trim()) {
      toast.error("Doctor name is required");
      return;
    }

    const fee = Number(consultationFee || 0);

    if (!Number.isFinite(fee) || fee < 0) {
      toast.error(
        "Consultation fee must be a valid non-negative number"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/doctors/${doctorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctorName: doctorName.trim(),
            specialization: specialization.trim(),
            phone: phone.trim(),
            email: email.trim(),
            qualification: qualification.trim(),
            registrationNumber:
              registrationNumber.trim(),
            consultationFee: fee,
            chamber: chamber.trim(),
            notes: notes.trim(),
            isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update doctor"
        );
      }

      toast.success(
        data.message || "Doctor updated successfully"
      );

      router.push("/doctors");
    } catch (error) {
      console.error("Update doctor error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update doctor"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading doctor...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/doctors"
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Back to Doctors
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Edit Doctor
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update doctor information
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Doctor Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Doctor Name *
            </label>

            <input
              type="text"
              value={doctorName}
              onChange={(e) =>
                setDoctorName(e.target.value)
              }
              placeholder="Dr. John Doe"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Specialization */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Specialization
            </label>

            <input
              type="text"
              value={specialization}
              onChange={(e) =>
                setSpecialization(e.target.value)
              }
              placeholder="Cardiologist"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Phone
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="9876543210"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="doctor@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Qualification */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Qualification
            </label>

            <input
              type="text"
              value={qualification}
              onChange={(e) =>
                setQualification(e.target.value)
              }
              placeholder="MBBS, MD"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Registration Number */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Registration Number
            </label>

            <input
              type="text"
              value={registrationNumber}
              onChange={(e) =>
                setRegistrationNumber(e.target.value)
              }
              placeholder="Medical registration number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Consultation Fee */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Consultation Fee
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={consultationFee}
              onChange={(e) =>
                setConsultationFee(e.target.value)
              }
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Chamber */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Chamber / Room
            </label>

            <input
              type="text"
              value={chamber}
              onChange={(e) =>
                setChamber(e.target.value)
              }
              placeholder="Chamber 1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(e) =>
                setIsActive(e.target.value === "ACTIVE")
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              rows={4}
              placeholder="Additional information..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
          <Link
            href="/doctors"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Doctor"}
          </button>
        </div>
      </form>
    </div>
  );
}

