
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";

export async function GET() {
  try {
    await connectDB();

    // --------------------------------
    // 1. Total active medicines
    // --------------------------------
    const totalMedicines = await Medicine.countDocuments({
      isActive: true,
    });

    // --------------------------------
    // 2. Get medicines
    // --------------------------------
    const medicines = await Medicine.find({
      isActive: true,
    })
      .select("_id name minimumStock")
      .lean();

    // --------------------------------
    // 3. Calculate current stock
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
    // 4. Find low stock medicines
    // --------------------------------
    const lowStockMedicines = medicines
      .map((medicine) => {
        const currentStock =
          stockMap.get(medicine._id.toString()) ?? 0;

        return {
          _id: medicine._id,
          name: medicine.name,
          minimumStock: medicine.minimumStock,
          currentStock,
        };
      })
      .filter(
        (medicine) =>
          medicine.currentStock <= medicine.minimumStock
      );

    // --------------------------------
    // 5. Expiry dates
    // --------------------------------
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const nearExpiryDate = new Date(today);

    nearExpiryDate.setDate(
      nearExpiryDate.getDate() + 90
    );

    // --------------------------------
    // 6. Expired batches
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
    // 7. Near expiry batches
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

    // --------------------------------
    // 8. Expiry count
    // --------------------------------
    const expiredCount = expiredBatches.length;
    const nearExpiryCount = nearExpiryBatches.length;

    const expiryAlertCount =
      expiredCount + nearExpiryCount;

    // --------------------------------
    // 9. Stock status
    // --------------------------------
    const stockStatus =
      lowStockMedicines.length === 0
        ? "Healthy"
        : "Needs Attention";

    // --------------------------------
    // Response
    // --------------------------------
    return NextResponse.json(
      {
        success: true,

        dashboard: {
          totalMedicines,

          stockStatus,

          lowStockCount:
            lowStockMedicines.length,

          expiryAlertCount,

          expiredCount,

          nearExpiryCount,

          lowStockMedicines,

          expiredBatches,

          nearExpiryBatches,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard data",
      },
      { status: 500 }
    );
  }
}

