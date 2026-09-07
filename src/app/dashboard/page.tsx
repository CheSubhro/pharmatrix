

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserMenu from "@/components/auth/UserMenu";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="border-b bg-white px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Pharmatrix
            </h1>

            <p className="text-xs text-gray-500">
              Medical Shop Management System
            </p>
          </div>

          <UserMenu
            name={session.user.name}
            role={session.user.role}
          />
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl p-8">
        {/* Page title */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your medical shop
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Medicines */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Medicines
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Medicines in inventory
            </p>
          </div>

          {/* Stock Status */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Stock Status
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              Healthy
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Overall inventory status
            </p>
          </div>

          {/* Today's Sales */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Today's Sales
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              ₹0
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Total sales today
            </p>
          </div>

          {/* Low Stock */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Low Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Medicines need restocking
            </p>
          </div>
        </div>

        {/* Second Row */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Expired / Near Expiry */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Expired / Near Expiry
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Medicines require attention
            </p>
          </div>

          {/* Doctor Visits */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Doctor Visits
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Doctors visiting today
            </p>
          </div>

          {/* Revenue */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Today's Revenue
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              ₹0
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Revenue generated today
            </p>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Sales Chart Placeholder */}
          <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sales Overview
                </h3>

                <p className="text-sm text-gray-500">
                  Sales performance
                </p>
              </div>

              <span className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600">
                Last 7 Days
              </span>
            </div>

            <div className="mt-6 flex h-64 items-center justify-center rounded-lg border border-dashed bg-gray-50">
              <p className="text-sm text-gray-400">
                Sales chart will appear here
              </p>
            </div>
          </div>

          {/* Today's Doctors */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Today's Doctors
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Doctor visiting schedule
            </p>

            <div className="mt-6 rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-gray-400">
                No doctor visits scheduled
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock & Expiry */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Low Stock Medicines */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Low Stock Medicines
                </h3>

                <p className="text-sm text-gray-500">
                  Medicines that need restocking
                </p>
              </div>

              <span className="text-sm font-medium text-gray-500">
                0 items
              </span>
            </div>

            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-gray-400">
                No low stock medicines
              </p>
            </div>
          </div>

          {/* Expiring Medicines */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Expired / Near Expiry
                </h3>

                <p className="text-sm text-gray-500">
                  Medicines requiring attention
                </p>
              </div>

              <span className="text-sm font-medium text-gray-500">
                0 items
              </span>
            </div>

            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-gray-400">
                No expiry alerts
              </p>
            </div>
          </div>
        </div>

        
      </section>
    </main>
  );
}

