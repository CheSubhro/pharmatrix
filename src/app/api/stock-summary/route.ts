

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";

export async function GET() {
  try {
    await connectDB();

    const medicines = await Medicine.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    const batches = await MedicineBatch.find({ isActive: true })
      .populate(
        "medicine",
        "name genericName company strength dosageForm rack shelf minimumStock"
      )
      .sort({ expiryDate: 1 })
      .lean();

    const stockSummary = medicines.map((medicine: any) => {
      const medicineBatches = batches.filter(
        (batch: any) =>
          batch.medicine?._id?.toString() === medicine._id.toString()
      );

      const totalStock = medicineBatches.reduce(
        (total: number, batch: any) =>
          total + Number(batch.currentStock || 0),
        0
      );

      const minimumStock = Number(medicine.minimumStock || 0);

      let stockStatus = "Good";

      if (totalStock === 0) {
        stockStatus = "Out of Stock";
      } else if (totalStock <= minimumStock) {
        stockStatus = "Low Stock";
      }

      return {
        medicine: {
          _id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          company: medicine.company,
          strength: medicine.strength,
          dosageForm: medicine.dosageForm,
          rack: medicine.rack,
          shelf: medicine.shelf,
          minimumStock,
        },

        totalStock,

        batchCount: medicineBatches.length,

        stockStatus,

        batches: medicineBatches.map((batch: any) => ({
          _id: batch._id,
          batchNumber: batch.batchNumber,
          manufacturingDate: batch.manufacturingDate,
          expiryDate: batch.expiryDate,
          initialStock: batch.initialStock,
          currentStock: batch.currentStock,
        })),
      };
    });

    return NextResponse.json(
      {
        success: true,
        stockSummary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/stock-summary error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stock summary",
      },
      { status: 500 }
    );
  }
}

