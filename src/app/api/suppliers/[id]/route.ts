

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Supplier from "@/models/Supplier";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get single supplier
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const supplier = await Supplier.findById(id).lean();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        supplier,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/suppliers/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch supplier",
      },
      { status: 500 }
    );
  }
}

// PUT - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;
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
      isActive,
    } = body;

    if (!supplierName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier name is required",
        },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 }
      );
    }

    supplier.supplierName = supplierName.trim();
    supplier.companyName = companyName?.trim() || undefined;
    supplier.phone = phone?.trim() || undefined;
    supplier.email = email?.trim() || undefined;
    supplier.address = address?.trim() || undefined;
    supplier.gstin = gstin?.trim() || undefined;
    supplier.contactPerson = contactPerson?.trim() || undefined;
    supplier.paymentTerms = paymentTerms?.trim() || undefined;

    if (typeof isActive === "boolean") {
      supplier.isActive = isActive;
    }

    await supplier.save();

    return NextResponse.json(
      {
        success: true,
        message: "Supplier updated successfully",
        supplier,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/suppliers/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update supplier",
      },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate supplier
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 }
      );
    }

    supplier.isActive = false;

    await supplier.save();

    return NextResponse.json(
      {
        success: true,
        message: "Supplier deactivated successfully",
        supplier,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/suppliers/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to deactivate supplier",
      },
      { status: 500 }
    );
  }
}

