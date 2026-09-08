

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Medicine from "@/models/Medicine";

// GET - Get all sales
export async function GET() {
  try {
    await connectDB();

    const sales = await Sale.find()
      .populate(
        "items.medicine",
        "name genericName company strength dosageForm"
      )
      .populate("items.batch", "batchNumber expiryDate")
      .sort({ saleDate: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        sales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/sales error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new sale
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      billNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      tax,
      grandTotal,
      paymentMethod,
      paymentStatus,
      status,
      saleDate,
      note,
    } = body;

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one medicine is required",
        },
        { status: 400 }
      );
    }

    if (subtotal === undefined || Number(subtotal) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid subtotal is required",
        },
        { status: 400 }
      );
    }

    if (grandTotal === undefined || Number(grandTotal) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid grand total is required",
        },
        { status: 400 }
      );
    }

    if (
      paymentMethod &&
      !["CASH", "UPI", "CARD", "CREDIT"].includes(paymentMethod)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
        },
        { status: 400 }
      );
    }

    if (
      paymentStatus &&
      !["PAID", "PENDING", "PARTIAL"].includes(paymentStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status",
        },
        { status: 400 }
      );
    }

    if (
      status &&
      !["DRAFT", "COMPLETED", "CANCELLED"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sale status",
        },
        { status: 400 }
      );
    }

    // Generate bill number if not provided
    let finalBillNumber = billNumber?.trim();

    if (!finalBillNumber) {
      finalBillNumber = `BILL-${Date.now()}`;
    }

    // Check duplicate bill number
    const existingSale = await Sale.findOne({
      billNumber: finalBillNumber,
    });

    if (existingSale) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill number already exists",
        },
        { status: 409 }
      );
    }

    // Validate and prepare sale items
    const preparedItems = [];

    for (const item of items) {
      if (!item.medicine) {
        return NextResponse.json(
          {
            success: false,
            message: "Medicine is required for every item",
          },
          { status: 400 }
        );
      }

      if (!item.quantity || Number(item.quantity) < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Quantity must be at least 1",
          },
          { status: 400 }
        );
      }

      if (
        item.sellingPrice === undefined ||
        Number(item.sellingPrice) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid selling price is required",
          },
          { status: 400 }
        );
      }

      if (item.taxRate === undefined || Number(item.taxRate) < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid tax rate is required",
          },
          { status: 400 }
        );
      }

      if (item.discount === undefined || Number(item.discount) < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid item discount is required",
          },
          { status: 400 }
        );
      }

      if (item.total === undefined || Number(item.total) < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid item total is required",
          },
          { status: 400 }
        );
      }

      // Verify medicine exists
      const medicine = await Medicine.findById(item.medicine).lean();

      if (!medicine) {
        return NextResponse.json(
          {
            success: false,
            message: `Medicine not found: ${item.medicine}`,
          },
          { status: 404 }
        );
      }

      preparedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        genericName: medicine.genericName,

        batch: item.batch || undefined,
        batchNumber: item.batchNumber?.trim() || undefined,

        quantity: Number(item.quantity),
        sellingPrice: Number(item.sellingPrice),
        taxRate: Number(item.taxRate),
        discount: Number(item.discount),
        total: Number(item.total),
      });
    }

    const sale = await Sale.create({
      billNumber: finalBillNumber,

      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,

      items: preparedItems,

      subtotal: Number(subtotal),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      grandTotal: Number(grandTotal),

      paymentMethod: paymentMethod || "CASH",
      paymentStatus: paymentStatus || "PAID",

      status: status || "DRAFT",

      saleDate: saleDate ? new Date(saleDate) : new Date(),

      note: note?.trim() || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Sale created successfully",
        sale,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sales error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create sale",
      },
      { status: 500 }
    );
  }
}

