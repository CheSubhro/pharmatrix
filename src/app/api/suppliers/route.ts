

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Supplier from "@/models/Supplier";

// GET - Get all suppliers
export async function GET() {
  try {
    await connectDB();

    const suppliers = await Supplier.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        suppliers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/suppliers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch suppliers",
      },
      { status: 500 }
    );
  }
}

// POST - Create supplier
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      supplierName,
      companyName,
      phone,
      email,
      address,
      gstin,
      contactPerson,
      paymentTerms,
    } = body;

    // Required field validation
    if (!supplierName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier name is required",
        },
        { status: 400 }
      );
    }

    // Create supplier
    const supplier = await Supplier.create({
      supplierName: supplierName.trim(),
      companyName: companyName?.trim() || undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim() || undefined,
      address: address?.trim() || undefined,
      gstin: gstin?.trim() || undefined,
      contactPerson: contactPerson?.trim() || undefined,
      paymentTerms: paymentTerms?.trim() || undefined,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Supplier created successfully",
        supplier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/suppliers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create supplier",
      },
      { status: 500 }
    );
  }
}

