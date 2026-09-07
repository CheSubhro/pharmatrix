
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

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
        setError(data.message || "Failed to create user");
        return;
      }

      setMessage("User created successfully.");

      setName("");
      setEmail("");
      setPassword("");
      setRole("PHARMACIST");
      setIsActive(true);

      setTimeout(() => {
        router.push("/users");
      }, 1000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">
            Create User
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add a new staff member to Pharmatrix.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-md border px-3 py-2"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Role
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
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

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) =>
                  setIsActive(e.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium">
                Active User
              </span>
            </label>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-black px-5 py-2 text-white disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create User"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-md border px-5 py-2 hover:bg-gray-100"
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