

import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";

export async function GET() {
  try {
    await connectDB();

    // --------------------------------
    // Get active medicines
    // --------------------------------

    const medicines = await Medicine.find({
      isActive: true,
    })
      .select(
        "_id name genericName company category strength dosageForm rack shelf minimumStock purchasePrice sellingPrice"
      )
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
    // Generate reorder recommendations
    // --------------------------------

    const recommendations = medicines
      .map((medicine) => {
        const currentStock =
          stockMap.get(medicine._id.toString()) ?? 0;

        const minimumStock = medicine.minimumStock ?? 0;

        // Target stock = 2 × minimum stock
        const targetStock = minimumStock * 2;

        const recommendedOrderQuantity =
          Math.max(targetStock - currentStock, 0);

        let status = "Good";

        if (currentStock === 0) {
          status = "Out of Stock";
        } else if (currentStock <= minimumStock) {
          status = "Low Stock";
        }

        return {
          _id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          company: medicine.company,
          category: medicine.category,
          strength: medicine.strength,
          dosageForm: medicine.dosageForm,
          rack: medicine.rack,
          shelf: medicine.shelf,

          minimumStock,
          currentStock,
          targetStock,
          recommendedOrderQuantity,

          purchasePrice: medicine.purchasePrice,
          estimatedPurchaseCost:
            recommendedOrderQuantity *
            (medicine.purchasePrice ?? 0),

          status,
        };
      })
      .filter(
        (medicine) =>
          medicine.recommendedOrderQuantity > 0
      )
      .sort(
        (a, b) =>
          b.recommendedOrderQuantity -
          a.recommendedOrderQuantity
      );

    // --------------------------------
    // Summary
    // --------------------------------

    const totalRecommendations =
      recommendations.length;

    const totalRecommendedUnits =
      recommendations.reduce(
        (total, medicine) =>
          total +
          medicine.recommendedOrderQuantity,
        0
      );

    const estimatedTotalPurchaseCost =
      recommendations.reduce(
        (total, medicine) =>
          total +
          medicine.estimatedPurchaseCost,
        0
      );

    const outOfStockCount =
      recommendations.filter(
        (medicine) =>
          medicine.status === "Out of Stock"
      ).length;

    const lowStockCount =
      recommendations.filter(
        (medicine) =>
          medicine.status === "Low Stock"
      ).length;

    return NextResponse.json(
      {
        success: true,

        summary: {
          totalRecommendations,
          totalRecommendedUnits,
          estimatedTotalPurchaseCost,
          outOfStockCount,
          lowStockCount,
        },

        recommendations,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/reorder-recommendations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch reorder recommendations",
      },
      {
        status: 500,
      }
    );
  }
}

