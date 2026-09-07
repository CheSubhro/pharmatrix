
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MedicineBatch from "@/models/MedicineBatch";
import Medicine from "@/models/Medicine";

// GET /api/medicine-batches
// Get all active medicine batches
export async function GET() {
  try {
    await connectDB();

    const batches = await MedicineBatch.find({ isActive: true })
      .populate("medicine", "name genericName company strength dosageForm")
      .sort({ expiryDate: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        batches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/medicine-batches error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch medicine batches",
      },
      { status: 500 }
    );
  }
}

// POST /api/medicine-batches
// Create a new medicine batch
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      medicine,
      batchNumber,
      manufacturingDate,
      expiryDate,
      initialStock,
    } = body;

    // Required field validation
    if (
      !medicine ||
      !batchNumber ||
      !expiryDate ||
      initialStock === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Medicine, batch number, expiry date and initial stock are required",
        },
        { status: 400 }
      );
    }

    // Check whether medicine exists
    const existingMedicine = await Medicine.findById(medicine);

    if (!existingMedicine) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine not found",
        },
        { status: 404 }
      );
    }

    // Validate stock
    if (Number(initialStock) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Initial stock cannot be negative",
        },
        { status: 400 }
      );
    }

    // Check duplicate batch for the same medicine
    const existingBatch = await MedicineBatch.findOne({
      medicine,
      batchNumber: batchNumber.trim(),
      isActive: true,
    });

    if (existingBatch) {
      return NextResponse.json(
        {
          success: false,
          message: "This batch already exists for this medicine",
        },
        { status: 409 }
      );
    }

    // Create batch
    const batch = await MedicineBatch.create({
      medicine,
      batchNumber: batchNumber.trim(),
      manufacturingDate: manufacturingDate || undefined,
      expiryDate,
      initialStock: Number(initialStock),
      currentStock: Number(initialStock),
      isActive: true,
    });

    const populatedBatch = await MedicineBatch.findById(batch._id)
      .populate("medicine", "name genericName company strength dosageForm")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Medicine batch created successfully",
        batch: populatedBatch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/medicine-batches error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create medicine batch",
      },
      { status: 500 }
    );
  }
}

