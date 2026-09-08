

import { NextRequest, NextResponse } from "next/server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

import MedicineBatch from "@/models/MedicineBatch";

import Medicine from "@/models/Medicine";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/medicine-batches/[id]
// Get single medicine batch
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid batch ID",
        },
        { status: 400 }
      );
    }

    const batch = await MedicineBatch.findOne({
      _id: id,
      isActive: true,
    })
      .populate(
        "medicine",
        "name genericName company strength dosageForm"
      )
      .lean();

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine batch not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        batch,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/medicine-batches/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch medicine batch",
      },
      { status: 500 }
    );
  }
}

// PUT /api/medicine-batches/[id]
// Update medicine batch
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid batch ID",
        },
        { status: 400 }
      );
    }

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

    if (
      initialStock === undefined ||
      initialStock === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Initial stock is required",
        },
        { status: 400 }
      );
    }

    // Check medicine
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

    // Validate initial stock
    const stock = Number(initialStock);

    if (!Number.isFinite(stock)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Initial stock must be a valid number",
        },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Initial stock cannot be negative",
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

    // Validate manufacturing date
    let manufacturing:
      | Date
      | undefined;

    if (manufacturingDate) {
      manufacturing = new Date(
        manufacturingDate
      );

      if (
        Number.isNaN(
          manufacturing.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid manufacturing date",
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

    // Find current batch
    const currentBatch =
      await MedicineBatch.findOne({
        _id: id,
        isActive: true,
      });

    if (!currentBatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine batch not found",
        },
        { status: 404 }
      );
    }

    // Check duplicate batch number
    const normalizedBatchNumber =
      batchNumber.trim();

    const existingBatch =
      await MedicineBatch.findOne({
        _id: { $ne: id },
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

    /*
     * Important:
     * Current stock is NOT directly updated here.
     *
     * Example:
     * Initial Stock = 100
     * Current Stock = 65
     *
     * If Initial Stock is edited to 120,
     * Current Stock should NOT automatically become 120.
     *
     * Stock changes will be handled separately
     * by Stock Management.
     */

    const batch =
      await MedicineBatch.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
        },
        {
          medicine,
          batchNumber: normalizedBatchNumber,
          manufacturingDate:
            manufacturing,
          expiryDate: expiry,
          initialStock: stock,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "medicine",
          "name genericName company strength dosageForm"
        )
        .lean();

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine batch not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Medicine batch updated successfully",
        batch,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUT /api/medicine-batches/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update medicine batch",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/medicine-batches/[id]
// Soft delete medicine batch
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid batch ID",
        },
        { status: 400 }
      );
    }

    const batch =
      await MedicineBatch.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
        },
        {
          isActive: false,
        },
        {
          new: true,
        }
      ).lean();

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine batch not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Medicine batch deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/medicine-batches/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete medicine batch",
      },
      { status: 500 }
    );
  }
}

