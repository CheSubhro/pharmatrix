
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const roles = [
  {
    value: "ADMIN",
    label: "Admin",
  },
  {
    value: "PHARMACIST",
    label: "Pharmacist",
  },
  {
    value: "BILLING_STAFF",
    label: "Billing Staff",
  },
  {
    value: "RECEPTIONIST",
    label: "Receptionist",
  },
];

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PHARMACIST");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadUser() {
    try {
      const response = await fetch(`/api/users/${id}`);

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message || "Failed to load user"
        );
        return;
      }

      const userData = data.user;

      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
      setRole(userData.role);
      setIsActive(userData.isActive);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          role,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message || "Failed to update user"
        );
        return;
      }

      toast.success("User updated successfully!", {
        description: `${name}'s information has been updated.`,
      });

      setTimeout(() => {
        router.push("/users");
      }, 1200);
    } catch {
      toast.error(
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading user...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">
            User Not Found
          </h1>

          <button
            onClick={() => router.push("/users")}
            className="mt-4 rounded-lg bg-black px-5 py-2 text-sm text-white"
          >
            Back to Users
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Edit User
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Update user information and access status.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="h-11 w-full rounded-lg border px-3 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="h-11 w-full rounded-lg border px-3 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                className="h-11 w-full rounded-lg border bg-white px-3 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              >
                {roles.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <div className="relative">
                <input
                  type="password"
                  disabled
                  placeholder="Password change is separate"
                  className="h-11 w-full rounded-lg border bg-gray-50 px-3 pr-11 text-gray-500"
                />

                <EyeOff
                  size={19}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                Password cannot be changed from this form.
              </p>
            </div>

            {/* Active User */}
            <div className="flex items-center md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) =>
                    setIsActive(e.target.checked)
                  }
                  className="h-4 w-4 rounded"
                />

                <div>
                  <p className="text-sm font-medium">
                    Active User
                  </p>

                  <p className="text-xs text-gray-500">
                    Inactive users will not be able to login.
                  </p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t pt-6 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/users")}
                className="rounded-lg border px-6 py-2.5 text-sm font-medium transition hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}