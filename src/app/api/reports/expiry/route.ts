
import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import MedicineBatch from "@/models/MedicineBatch";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const statusFilter =
      searchParams.get("status") || "ALL";

    const now = new Date();

    const batches = await MedicineBatch.find({
      isActive: true,
    })
      .populate(
        "medicine",
        "name genericName category rack shelf purchasePrice sellingPrice"
      )
      .populate(
        "supplier",
        "supplierName phone"
      )
      .sort({ expiryDate: 1, createdAt: 1 })
      .lean();

    const expiryReport = batches
      .filter((batch) => batch.medicine)
      .map((batch) => {
        const expiryDate = new Date(
          batch.expiryDate
        );

        const diffMs =
          expiryDate.getTime() - now.getTime();

        const daysLeft = Math.ceil(
          diffMs / (1000 * 60 * 60 * 24)
        );

        let expiryStatus:
          | "EXPIRED"
          | "NEAR_EXPIRY"
          | "GOOD";

        if (daysLeft < 0) {
          expiryStatus = "EXPIRED";
        } else if (daysLeft <= 30) {
          expiryStatus = "NEAR_EXPIRY";
        } else {
          expiryStatus = "GOOD";
        }

        const quantity = Number(
          batch.quantity || 0
        );

        const purchasePrice = Number(
          batch.purchasePrice ||
            batch.medicine.purchasePrice ||
            0
        );

        const stockValue =
          quantity * purchasePrice;

        return {
          _id: batch._id,
          batchNumber:
            batch.batchNumber || "-",

          medicineId:
            batch.medicine._id,

          medicineName:
            batch.medicine.name,

          genericName:
            batch.medicine.genericName || "",

          category:
            batch.medicine.category || "",

          rack:
            batch.medicine.rack || "-",

          shelf:
            batch.medicine.shelf || "-",

          supplier:
            batch.supplier?.supplierName ||
            "-",

          quantity,

          purchasePrice,

          sellingPrice: Number(
            batch.sellingPrice ||
              batch.medicine.sellingPrice ||
              0
          ),

          stockValue,

          expiryDate:
            batch.expiryDate,

          daysLeft,

          expiryStatus,
        };
      });

    const expiredCount =
      expiryReport.filter(
        (item) =>
          item.expiryStatus === "EXPIRED"
      ).length;

    const nearExpiryCount =
      expiryReport.filter(
        (item) =>
          item.expiryStatus ===
          "NEAR_EXPIRY"
      ).length;

    const goodCount =
      expiryReport.filter(
        (item) =>
          item.expiryStatus === "GOOD"
      ).length;

    const expiredStock =
      expiryReport
        .filter(
          (item) =>
            item.expiryStatus === "EXPIRED"
        )
        .reduce(
          (sum, item) =>
            sum + item.quantity,
          0
        );

    const nearExpiryStock =
      expiryReport
        .filter(
          (item) =>
            item.expiryStatus ===
            "NEAR_EXPIRY"
        )
        .reduce(
          (sum, item) =>
            sum + item.quantity,
          0
        );

    const expiredStockValue =
      expiryReport
        .filter(
          (item) =>
            item.expiryStatus === "EXPIRED"
        )
        .reduce(
          (sum, item) =>
            sum + item.stockValue,
          0
        );

    const nearExpiryStockValue =
      expiryReport
        .filter(
          (item) =>
            item.expiryStatus ===
            "NEAR_EXPIRY"
        )
        .reduce(
          (sum, item) =>
            sum + item.stockValue,
          0
        );

    let filteredReport = expiryReport;

    if (
      statusFilter === "EXPIRED" ||
      statusFilter === "NEAR_EXPIRY" ||
      statusFilter === "GOOD"
    ) {
      filteredReport =
        expiryReport.filter(
          (item) =>
            item.expiryStatus ===
            statusFilter
        );
    }

    return NextResponse.json(
      {
        success: true,

        summary: {
          totalBatches: expiryReport.length,

          expiredCount,
          nearExpiryCount,
          goodCount,

          expiredStock,
          nearExpiryStock,

          expiredStockValue,
          nearExpiryStockValue,
        },

        expiryReport: filteredReport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/reports/expiry error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate expiry report",
      },
      { status: 500 }
    );
  }
}
