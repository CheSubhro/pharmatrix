
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateUserPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PHARMACIST");
  const [isActive, setIsActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message || "Failed to create user"
        );
        return;
      }

      toast.success("User created successfully!", {
        description: `${name} has been added to Pharmatrix.`,
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("PHARMACIST");
      setIsActive(true);

      setTimeout(() => {
        router.push("/users");
      }, 1200);
    } catch {
      toast.error(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Create User
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Add a new staff member to Pharmatrix.
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
                placeholder="Enter full name"
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
                placeholder="Enter email address"
                className="h-11 w-full rounded-lg border px-3 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="h-11 w-full rounded-lg border px-3 pr-11 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                Password must be at least 6 characters.
              </p>
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
                    User will be able to login immediately.
                  </p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t pt-6 md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating..."
                  : "Create User"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/users")
                }
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

