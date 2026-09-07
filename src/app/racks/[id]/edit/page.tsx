

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Rack {
  _id: string;
  name: string;
  code: string;
  shelves: string[];
  description?: string;
  isActive: boolean;
}

export default function EditRackPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [shelves, setShelves] = useState<string[]>([""]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRack = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/racks/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch rack"
          );
        }

        const rack: Rack = data.rack;

        setFormData({
          name: rack.name || "",
          code: rack.code || "",
          description: rack.description || "",
        });

        setShelves(
          rack.shelves && rack.shelves.length > 0
            ? rack.shelves
            : [""]
        );
      } catch (error) {
        console.error("Fetch rack error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch rack"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRack();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShelfChange = (
    index: number,
    value: string
  ) => {
    setShelves((prev) =>
      prev.map((shelf, i) =>
        i === index ? value : shelf
      )
    );
  };

  const addShelf = () => {
    setShelves((prev) => [...prev, ""]);
  };

  const removeShelf = (index: number) => {
    setShelves((prev) => {
      if (prev.length === 1) {
        return [""];
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Rack name is required.");
      return;
    }

    if (!formData.code.trim()) {
      toast.error("Rack code is required.");
      return;
    }

    const cleanedShelves = shelves
      .map((shelf) => shelf.trim())
      .filter(Boolean);

    try {
      setSaving(true);

      const response = await fetch(`/api/racks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim(),
          shelves: cleanedShelves,
          description: formData.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update rack"
        );
      }

      toast.success("Rack updated successfully");

      router.push("/racks");
      router.refresh();
    } catch (error) {
      console.error("Update rack error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update rack"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              Loading rack...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="rounded-xl border border-red-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>

            <Link
              href="/racks"
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Back to Racks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Rack
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update rack information and shelf details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Rack Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Rack Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rack A"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Rack Code */}
              <div>
                <label
                  htmlFor="code"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Rack Code
                </label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. RACK-A"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm uppercase outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Use a unique code for this rack.
                </p>
              </div>
            </div>
          </section>

          {/* Shelves */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Shelves
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage the shelves available inside this rack.
                </p>
              </div>

              <button
                type="button"
                onClick={addShelf}
                className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                + Add Shelf
              </button>
            </div>

            <div className="space-y-3">
              {shelves.map((shelf, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={shelf}
                      onChange={(e) =>
                        handleShelfChange(
                          index,
                          e.target.value
                        )
                      }
                      placeholder={`e.g. Shelf ${index + 1}`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeShelf(index)}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Description
            </h2>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="e.g. Main medicine storage rack"
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/racks"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Rack"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

