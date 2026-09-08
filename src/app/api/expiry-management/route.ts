
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MedicineBatch from "@/models/MedicineBatch";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const now = new Date();

    // Start of today
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Near expiry = next 90 days
    const nearExpiryDate = new Date(today);
    nearExpiryDate.setDate(nearExpiryDate.getDate() + 90);

    const batches = await MedicineBatch.find({
      isActive: true,
    })
      .populate(
        "medicine",
        "name genericName company category strength dosageForm rack shelf minimumStock"
      )
      .sort({ expiryDate: 1 })
      .lean();

    const processedBatches = batches
      .map((batch: any) => {
        const expiryDate = new Date(batch.expiryDate);

        const expiryDay = new Date(
          expiryDate.getFullYear(),
          expiryDate.getMonth(),
          expiryDate.getDate()
        );

        const diffMs = expiryDay.getTime() - today.getTime();
        const daysDifference = Math.ceil(
          diffMs / (1000 * 60 * 60 * 24)
        );

        let batchStatus: "EXPIRED" | "NEAR_EXPIRY" | "GOOD";

        if (expiryDay < today) {
          batchStatus = "EXPIRED";
        } else if (expiryDay <= nearExpiryDate) {
          batchStatus = "NEAR_EXPIRY";
        } else {
          batchStatus = "GOOD";
        }

        return {
          ...batch,
          status: batchStatus,
          daysLeft: daysDifference,
        };
      })
      .filter((batch: any) => {
        if (status !== "ALL" && batch.status !== status) {
          return false;
        }

        if (!search) {
          return true;
        }

        const medicine = batch.medicine || {};

        const searchText = [
          medicine.name,
          medicine.genericName,
          medicine.company,
          medicine.category,
          medicine.strength,
          medicine.dosageForm,
          medicine.rack,
          medicine.shelf,
          batch.batchNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchText.includes(search.toLowerCase());
      });

    const summary = {
      totalBatches: processedBatches.length,

      expiredCount: processedBatches.filter(
        (batch: any) => batch.status === "EXPIRED"
      ).length,

      nearExpiryCount: processedBatches.filter(
        (batch: any) => batch.status === "NEAR_EXPIRY"
      ).length,

      goodCount: processedBatches.filter(
        (batch: any) => batch.status === "GOOD"
      ).length,

      expiredStock: processedBatches
        .filter((batch: any) => batch.status === "EXPIRED")
        .reduce(
          (total: number, batch: any) =>
            total + Number(batch.currentStock || 0),
          0
        ),

      nearExpiryStock: processedBatches
        .filter((batch: any) => batch.status === "NEAR_EXPIRY")
        .reduce(
          (total: number, batch: any) =>
            total + Number(batch.currentStock || 0),
          0
        ),
    };

    return NextResponse.json({
      success: true,
      summary,
      batches: processedBatches,
    });
  } catch (error) {
    console.error("GET /api/expiry-management error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch expiry management data",
      },
      { status: 500 }
    );
  }
}

