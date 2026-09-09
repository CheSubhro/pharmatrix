

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Doctor {
  _id: string;
  doctorName: string;
  specialization?: string;
}

interface Schedule {
  _id: string;
  doctor: Doctor;
  dayOfWeek:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  startTime: string;
  endTime: string;
  chamber?: string;
  isActive: boolean;
  notes?: string;
}

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

export default function DoctorSchedulesPage() {
  const params = useParams();
  const router = useRouter();

  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [dayOfWeek, setDayOfWeek] =
    useState("MONDAY");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [chamber, setChamber] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const fetchData = async () => {
    try {
      setLoading(true);

      const [doctorResponse, scheduleResponse] =
        await Promise.all([
          fetch(`/api/doctors/${doctorId}`),
          fetch(`/api/doctors/${doctorId}/schedules`),
        ]);

      const doctorData =
        await doctorResponse.json();

      const scheduleData =
        await scheduleResponse.json();

      if (!doctorResponse.ok || !doctorData.success) {
        throw new Error(
          doctorData.message ||
            "Failed to fetch doctor"
        );
      }

      if (
        !scheduleResponse.ok ||
        !scheduleData.success
      ) {
        throw new Error(
          scheduleData.message ||
            "Failed to fetch schedules"
        );
      }

      setDoctor(doctorData.doctor);
      setSchedules(scheduleData.schedules || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load doctor schedules"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchData();
    }
  }, [doctorId]);

  const resetForm = () => {
    setDayOfWeek("MONDAY");
    setStartTime("");
    setEndTime("");
    setChamber("");
    setNotes("");
  };

  const handleAddSchedule = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!dayOfWeek) {
      toast.error("Please select a day.");
      return;
    }

    if (!startTime || !endTime) {
      toast.error(
        "Start time and end time are required."
      );
      return;
    }

    if (startTime >= endTime) {
      toast.error(
        "End time must be later than start time."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/doctors/${doctorId}/schedules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dayOfWeek,
            startTime,
            endTime,
            chamber,
            notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 409) {
          toast.error(
            data.message ||
              "Schedule conflict detected."
          );
        } else {
          toast.error(
            data.message ||
              "Failed to create schedule."
          );
        }

        return;
      }

      toast.success(
        "Visiting schedule added successfully."
      );

      setSchedules((current) => [
        ...current,
        data.schedule,
      ]);

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create schedule."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDay = (day: string) => {
    const foundDay = DAYS.find(
      (item) => item.value === day
    );

    return foundDay?.label || day;
  };

  const formatTime = (time: string) => {
    if (!time) return "-";

    const [hours, minutes] =
      time.split(":").map(Number);

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Loading schedules...
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6">
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-gray-600">
            Doctor not found.
          </p>

          <button
            type="button"
            onClick={() => router.push("/doctors")}
            className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/doctors")}
            className="mb-2 text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to Doctors
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Visiting Schedule
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {doctor.doctorName}
            {doctor.specialization
              ? ` • ${doctor.specialization}`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm((current) => !current);
          }}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {showForm
            ? "Close Form"
            : "+ Add Schedule"}
        </button>
      </div>

      {/* Add Schedule Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Add Visiting Schedule
          </h2>

          <form
            onSubmit={handleAddSchedule}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Day */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Visiting Day *
                </label>

                <select
                  value={dayOfWeek}
                  onChange={(event) =>
                    setDayOfWeek(event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                >
                  {DAYS.map((day) => (
                    <option
                      key={day.value}
                      value={day.value}
                    >
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chamber */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Chamber / Room
                </label>

                <input
                  type="text"
                  value={chamber}
                  onChange={(event) =>
                    setChamber(event.target.value)
                  }
                  placeholder="e.g. Chamber 1"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time *
                </label>

                <input
                  type="time"
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Time *
                </label>

                <input
                  type="time"
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={3}
                placeholder="Optional notes"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule List */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Current Visiting Schedule
          </h2>
        </div>

        {schedules.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              No visiting schedule added yet.
            </p>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add Schedule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700">
                    Day
                  </th>

                  <th className="px-6 py-3 font-semibold text-gray-700">
                    Time
                  </th>

                  <th className="px-6 py-3 font-semibold text-gray-700">
                    Chamber
                  </th>

                  <th className="px-6 py-3 font-semibold text-gray-700">
                    Notes
                  </th>

                  <th className="px-6 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {schedules.map((schedule) => (
                  <tr
                    key={schedule._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatDay(
                        schedule.dayOfWeek
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {formatTime(
                        schedule.startTime
                      )}{" "}
                      -{" "}
                      {formatTime(
                        schedule.endTime
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {schedule.chamber || "-"}
                    </td>

                    <td className="max-w-xs px-6 py-4 text-gray-500">
                      {schedule.notes || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
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

