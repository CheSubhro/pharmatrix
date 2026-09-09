

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const medicines = await Medicine.find({
      isActive: true,
    })
      .populate("category", "name")
      .populate("rack", "name code")
      .sort({ name: 1 })
      .lean();

    const batches = await MedicineBatch.find({
      isActive: true,
    })
      .populate(
        "medicine",
        "name genericName purchasePrice sellingPrice minimumStock"
      )
      .sort({ expiryDate: 1 })
      .lean();

    const stockMap = new Map<
      string,
      {
        currentStock: number;
        stockValue: number;
        batchCount: number;
      }
    >();

    batches.forEach((batch) => {
      if (!batch.medicine) return;

      const medicineId =
        batch.medicine._id.toString();

      const quantity = Number(
        batch.quantity || 0
      );

      const purchasePrice = Number(
        batch.purchasePrice ||
          batch.medicine.purchasePrice ||
          0
      );

      const existing =
        stockMap.get(medicineId);

      if (existing) {
        existing.currentStock += quantity;
        existing.stockValue +=
          quantity * purchasePrice;
        existing.batchCount += 1;
      } else {
        stockMap.set(medicineId, {
          currentStock: quantity,
          stockValue:
            quantity * purchasePrice,
          batchCount: 1,
        });
      }
    });

    const stockReport = medicines.map(
      (medicine) => {
        const medicineId =
          medicine._id.toString();

        const stockData =
          stockMap.get(medicineId);

        const currentStock =
          stockData?.currentStock || 0;

        const stockValue =
          stockData?.stockValue || 0;

        const batchCount =
          stockData?.batchCount || 0;

        const minimumStock =
          Number(
            medicine.minimumStock || 0
          );

        let stockStatus:
          | "OUT_OF_STOCK"
          | "LOW_STOCK"
          | "GOOD";

        if (currentStock <= 0) {
          stockStatus = "OUT_OF_STOCK";
        } else if (
          currentStock <= minimumStock
        ) {
          stockStatus = "LOW_STOCK";
        } else {
          stockStatus = "GOOD";
        }

        return {
          _id: medicine._id,
          name: medicine.name,
          genericName:
            medicine.genericName,
          category:
            medicine.category?.name ||
            "Uncategorized",

          rack:
            medicine.rack?.name ||
            "-",

          rackCode:
            medicine.rack?.code ||
            "-",

          shelf:
            medicine.shelf || "-",

          currentStock,
          minimumStock,
          batchCount,
          stockValue,

          purchasePrice:
            Number(
              medicine.purchasePrice || 0
            ),

          sellingPrice:
            Number(
              medicine.sellingPrice || 0
            ),

          stockStatus,
        };
      }
    );

    const totalMedicines =
      stockReport.length;

    const totalStock =
      stockReport.reduce(
        (sum, medicine) =>
          sum + medicine.currentStock,
        0
      );

    const totalStockValue =
      stockReport.reduce(
        (sum, medicine) =>
          sum + medicine.stockValue,
        0
      );

    const inStockCount =
      stockReport.filter(
        (medicine) =>
          medicine.currentStock > 0
      ).length;

    const lowStockCount =
      stockReport.filter(
        (medicine) =>
          medicine.stockStatus ===
          "LOW_STOCK"
      ).length;

    const outOfStockCount =
      stockReport.filter(
        (medicine) =>
          medicine.stockStatus ===
          "OUT_OF_STOCK"
      ).length;

    const goodStockCount =
      stockReport.filter(
        (medicine) =>
          medicine.stockStatus === "GOOD"
      ).length;

    return NextResponse.json(
      {
        success: true,

        summary: {
          totalMedicines,
          totalStock,
          totalStockValue,
          inStockCount,
          lowStockCount,
          outOfStockCount,
          goodStockCount,
        },

        stockReport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/reports/stock error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate stock report",
      },
      { status: 500 }
    );
  }
}

