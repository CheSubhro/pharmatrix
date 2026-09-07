
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

// GET /api/medicines/[id]
// Get single medicine
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid medicine ID",
        },
        { status: 400 }
      );
    }

    const medicine = await Medicine.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        medicine,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/medicines/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch medicine",
      },
      { status: 500 }
    );
  }
}

// PUT /api/medicines/[id]
// Update medicine
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid medicine ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      genericName,
      company,
      category,
      strength,
      dosageForm,
      rack,
      minimumStock,
      sellingPrice,
      purchasePrice,
      taxRate,
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine name is required",
        },
        { status: 400 }
      );
    }

    if (
      sellingPrice === undefined ||
      sellingPrice === null ||
      Number(sellingPrice) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid selling price is required",
        },
        { status: 400 }
      );
    }

    if (
      purchasePrice === undefined ||
      purchasePrice === null ||
      Number(purchasePrice) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid purchase price is required",
        },
        { status: 400 }
      );
    }

    const medicine = await Medicine.findOneAndUpdate(
      {
        _id: id,
        isActive: true,
      },
      {
        name: name.trim(),
        genericName,
        company,
        category,
        strength,
        dosageForm,
        rack,
        minimumStock:
          minimumStock !== undefined ? Number(minimumStock) : 10,
        sellingPrice: Number(sellingPrice),
        purchasePrice: Number(purchasePrice),
        taxRate: taxRate !== undefined ? Number(taxRate) : 0,
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Medicine updated successfully",
        medicine,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/medicines/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update medicine",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/medicines/[id]
// Soft delete medicine
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid medicine ID",
        },
        { status: 400 }
      );
    }

    const medicine = await Medicine.findOneAndUpdate(
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

    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Medicine deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/medicines/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete medicine",
      },
      { status: 500 }
    );
  }
}