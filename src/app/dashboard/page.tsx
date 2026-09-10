

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await connectDB();

  // --------------------------------
  // Total active medicines
  // --------------------------------

  const totalMedicines = await Medicine.countDocuments({
    isActive: true,
  });

  // --------------------------------
  // Get active medicines
  // --------------------------------

  const medicines = await Medicine.find({
    isActive: true,
  })
    .select("_id name minimumStock")
    .lean();

  // --------------------------------
  // Calculate current stock
  // --------------------------------

  const stockAggregation = await MedicineBatch.aggregate([
    {
      $match: {
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$medicine",
        currentStock: {
          $sum: "$currentStock",
        },
      },
    },
  ]);

  const stockMap = new Map(
    stockAggregation.map((item) => [
      item._id.toString(),
      item.currentStock,
    ])
  );

  // --------------------------------
  // Medicine stock summary
  // --------------------------------

  const medicineStock = medicines.map((medicine) => {
    const currentStock =
      stockMap.get(medicine._id.toString()) ?? 0;

    return {
      name: medicine.name,
      minimumStock: medicine.minimumStock,
      currentStock,
    };
  });

  // --------------------------------
  // Total stock
  // --------------------------------

  const totalStock = medicineStock.reduce(
    (total, medicine) =>
      total + medicine.currentStock,
    0
  );

  // --------------------------------
  // Low stock medicines
  // --------------------------------
  // 0 stock medicines are handled separately
  // in Out of Stock section.

  const lowStockMedicines = medicineStock.filter(
    (medicine) =>
      medicine.currentStock > 0 &&
      medicine.currentStock <= medicine.minimumStock
  );

  // --------------------------------
  // Out of stock medicines
  // --------------------------------

  const outOfStockMedicines = medicineStock.filter(
    (medicine) => medicine.currentStock === 0
  );

  // --------------------------------
  // Expiry dates
  // --------------------------------

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const nearExpiryDate = new Date(today);

  nearExpiryDate.setDate(
    nearExpiryDate.getDate() + 90
  );

  // --------------------------------
  // Expired batches
  // --------------------------------

  const expiredBatches = await MedicineBatch.find({
    isActive: true,
    expiryDate: {
      $lt: today,
    },
  })
    .populate(
      "medicine",
      "name genericName company strength dosageForm"
    )
    .sort({ expiryDate: 1 })
    .lean();

  // --------------------------------
  // Near expiry batches
  // --------------------------------

  const nearExpiryBatches = await MedicineBatch.find({
    isActive: true,
    expiryDate: {
      $gte: today,
      $lte: nearExpiryDate,
    },
  })
    .populate(
      "medicine",
      "name genericName company strength dosageForm"
    )
    .sort({ expiryDate: 1 })
    .lean();

  const expiryAlertCount =
    expiredBatches.length +
    nearExpiryBatches.length;

  // --------------------------------
  // Stock status
  // --------------------------------

  const stockStatus =
    lowStockMedicines.length === 0 &&
    outOfStockMedicines.length === 0
      ? "Healthy"
      : "Needs Attention";

  return (
    <main className="min-h-screen bg-gray-100">
     
      {/* Dashboard */}

      <section className="mx-auto max-w-7xl p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your medical shop
          </p>
        </div>

        {/* Main Cards */}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Medicines */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Medicines
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalMedicines}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Medicines in inventory
            </p>
          </div>

          {/* Total Stock */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalStock}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Total units available
            </p>
          </div>

          {/* Stock Status */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Stock Status
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stockStatus}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Overall inventory status
            </p>
          </div>

          {/* Low Stock */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Low Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {lowStockMedicines.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Medicines need restocking
            </p>
          </div>

          {/* Out of Stock */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Out of Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {outOfStockMedicines.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Medicines currently unavailable
            </p>
          </div>
        </div>

        {/* Secondary Cards */}

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Expiry */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Expired / Near Expiry
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {expiryAlertCount}
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
              Doctor module coming soon
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
              Sales module coming soon
            </p>
          </div>
        </div>

        {/* Sales + Doctors */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Sales Overview */}

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

          {/* Doctors */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Today's Doctors
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Doctor visiting schedule
            </p>

            <div className="mt-6 rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-gray-400">
                Doctor module coming soon
              </p>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
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
                {lowStockMedicines.length} items
              </span>
            </div>

            <div className="mt-6">
              {lowStockMedicines.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-gray-400">
                    No low stock medicines
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockMedicines.map((medicine) => (
                    <div
                      key={medicine.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {medicine.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          Minimum stock:{" "}
                          {medicine.minimumStock}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {medicine.currentStock}
                        </p>

                        <p className="text-xs text-gray-500">
                          Current stock
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Out of Stock Medicines */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Out of Stock Medicines
                </h3>

                <p className="text-sm text-gray-500">
                  Medicines currently unavailable
                </p>
              </div>

              <span className="text-sm font-medium text-gray-500">
                {outOfStockMedicines.length} items
              </span>
            </div>

            <div className="mt-6">
              {outOfStockMedicines.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-gray-400">
                    No out of stock medicines
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outOfStockMedicines.map((medicine) => (
                    <div
                      key={medicine.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {medicine.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          Minimum stock:{" "}
                          {medicine.minimumStock}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          0
                        </p>

                        <p className="text-xs text-gray-500">
                          Current stock
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expiry */}

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
                {expiryAlertCount} items
              </span>
            </div>

            <div className="mt-6">
              {expiryAlertCount === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-gray-400">
                    No expiry alerts
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    ...expiredBatches,
                    ...nearExpiryBatches,
                  ]
                    .slice(0, 5)
                    .map((batch) => {
                      const medicine =
                        batch.medicine as {
                          name?: string;
                        };

                      return (
                        <div
                          key={batch._id.toString()}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {medicine?.name ||
                                "Unknown Medicine"}
                            </p>

                            <p className="text-xs text-gray-500">
                              Batch: {batch.batchNumber}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(
                                batch.expiryDate
                              ).toLocaleDateString("en-IN")}
                            </p>

                            <p className="text-xs text-gray-500">
                              {new Date(
                                batch.expiryDate
                              ) < today
                                ? "Expired"
                                : "Near expiry"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

