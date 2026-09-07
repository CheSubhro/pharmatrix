

import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Medicine from "@/models/Medicine";

// GET /api/medicines
// Get all active medicines
export async function GET() {
  try {
    await connectDB();

    const medicines = await Medicine.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        medicines,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/medicines error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch medicines",
      },
      { status: 500 }
    );
  }
}

// POST /api/medicines
// Create a new medicine
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      name,
      genericName,
      company,
      category,
      strength,
      dosageForm,
      rack,
      shelf,
      minimumStock,
      sellingPrice,
      purchasePrice,
      taxRate,
    } = body;

    // Required field validation
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

    const medicine = await Medicine.create({
      name: name.trim(),
      genericName,
      company,
      category,
      strength,
      dosageForm,
      rack,
      shelf,
      minimumStock:
        minimumStock !== undefined ? Number(minimumStock) : 10,
      sellingPrice: Number(sellingPrice),
      purchasePrice: Number(purchasePrice),
      taxRate: taxRate !== undefined ? Number(taxRate) : 0,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Medicine created successfully",
        medicine,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/medicines error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create medicine",
      },
      { status: 500 }
    );
  }
}

