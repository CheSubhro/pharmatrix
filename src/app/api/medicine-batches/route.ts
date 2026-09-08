
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import MedicineBatch from "@/models/MedicineBatch";

import Medicine from "@/models/Medicine";

// GET /api/medicine-batches
// Get all active medicine batches
export async function GET() {
  try {
    await connectDB();

    const batches = await MedicineBatch.find({
      isActive: true,
    })
      .populate(
        "medicine",
        "name genericName company strength dosageForm"
      )
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
    console.error(
      "GET /api/medicine-batches error:",
      error
    );

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
export async function POST(
  request: NextRequest
) {
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
    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine is required",
        },
        { status: 400 }
      );
    }

    if (
      !batchNumber ||
      typeof batchNumber !== "string" ||
      batchNumber.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Batch number is required",
        },
        { status: 400 }
      );
    }

    if (!expiryDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Expiry date is required",
        },
        { status: 400 }
      );
    }

    if (initialStock === undefined || initialStock === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Initial stock is required",
        },
        { status: 400 }
      );
    }

    // Check whether medicine exists
    const existingMedicine =
      await Medicine.findOne({
        _id: medicine,
        isActive: true,
      });

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
    const stock = Number(initialStock);

    if (!Number.isFinite(stock)) {
      return NextResponse.json(
        {
          success: false,
          message: "Initial stock must be a valid number",
        },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Initial stock cannot be negative",
        },
        { status: 400 }
      );
    }

    // Validate expiry date
    const expiry = new Date(expiryDate);

    if (Number.isNaN(expiry.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid expiry date",
        },
        { status: 400 }
      );
    }

    // Validate manufacturing date if provided
    let manufacturing: Date | undefined;

    if (manufacturingDate) {
      manufacturing = new Date(
        manufacturingDate
      );

      if (
        Number.isNaN(manufacturing.getTime())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid manufacturing date",
          },
          { status: 400 }
        );
      }

      if (manufacturing > expiry) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Manufacturing date cannot be after expiry date",
          },
          { status: 400 }
        );
      }
    }

    // Check duplicate batch for the same medicine
    const normalizedBatchNumber =
      batchNumber.trim();

    const existingBatch =
      await MedicineBatch.findOne({
        medicine,
        batchNumber: {
          $regex: `^${normalizedBatchNumber.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
        isActive: true,
      });

    if (existingBatch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This batch already exists for this medicine",
        },
        { status: 409 }
      );
    }

    // Create batch
    const batch = await MedicineBatch.create({
      medicine,
      batchNumber: normalizedBatchNumber,
      manufacturingDate: manufacturing,
      expiryDate: expiry,
      initialStock: stock,
      currentStock: stock,
      isActive: true,
    });

    // Return populated batch
    const populatedBatch =
      await MedicineBatch.findById(
        batch._id
      )
        .populate(
          "medicine",
          "name genericName company strength dosageForm"
        )
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          "Medicine batch created successfully",
        batch: populatedBatch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/medicine-batches error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create medicine batch",
      },
      { status: 500 }
    );
  }
}
