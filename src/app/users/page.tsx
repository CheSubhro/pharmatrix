
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const response = await fetch("/api/users");

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load users");
        return;
      }

      setUsers(data.users);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              User Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage Pharmatrix users and staff.
            </p>
          </div>

          <Link
            href="/users/create"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Create User
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">
              Loading users...
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Name
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Email
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Role
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Created
                    </th>

                    <th className="px-6 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium">
                        {user.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {user.email}
                      </td>

                      <td className="px-6 py-4">
                        {user.role}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            user.isActive
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                              : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                          }
                        >
                          {user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {new Date(
                          user.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/users/${user._id}/edit`}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-gray-100"
                        >
                          <Pencil size={15} />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

