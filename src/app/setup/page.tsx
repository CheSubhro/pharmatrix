
"use client";

import { FormEvent, useState } from "react";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/create-admin", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to create admin");
        return;
      }

      setMessage(
        "Super Admin created successfully. You can now login."
      );
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold">
          Medical Shop Management System
        </h1>

        <p className="mb-6 text-sm text-gray-500">
          Initial Super Admin Setup
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Name
            </label>

            <input
              type="text"
              value="Super Admin"
              readOnly
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value="admin@medicalshop.com"
              readOnly
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>

            <input
              type="text"
              value="Admin@123456"
              readOnly
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Super Admin"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-md bg-gray-100 p-3 text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}