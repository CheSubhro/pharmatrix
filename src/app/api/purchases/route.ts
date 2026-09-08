
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Medicine from "@/models/Medicine";
import Supplier from "@/models/Supplier";

export async function GET() {
  try {
    await connectDB();

    const purchases = await Purchase.find()
      .populate(
        "supplier",
        "supplierName companyName phone email gstin contactPerson paymentTerms"
      )
      .populate(
        "items.medicine",
        "name genericName company strength dosageForm"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error(
      "GET /api/purchases error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch purchases",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      purchaseNumber,
      supplier,
      supplierName,
      supplierPhone,
      invoiceNumber,
      purchaseDate,
      status,
      items,
      tax = 0,
      note,
    } = body;

    // Basic validation

    if (!purchaseNumber?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase number is required",
        },
        { status: 400 }
      );
    }

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier is required",
        },
        { status: 400 }
      );
    }

    // Validate supplier

    const selectedSupplier =
      await Supplier.findOne({
        _id: supplier,
        isActive: true,
      }).lean();

    if (!selectedSupplier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected supplier is invalid or inactive",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one purchase item is required",
        },
        { status: 400 }
      );
    }

    // Duplicate purchase number check

    const existingPurchase =
      await Purchase.findOne({
        purchaseNumber:
          purchaseNumber.trim(),
      });

    if (existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase number already exists",
        },
        { status: 409 }
      );
    }

    // Validate medicines

    const medicineIds = items.map(
      (item) => item.medicine
    );

    const medicines = await Medicine.find({
      _id: { $in: medicineIds },
      isActive: true,
    }).lean();

    if (
      medicines.length !== medicineIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more medicines are invalid or inactive",
        },
        { status: 400 }
      );
    }

    let subtotal = 0;

    const purchaseItems = [];

    for (const item of items) {
      if (!item.medicine) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Medicine is required for every item",
          },
          { status: 400 }
        );
      }

      if (!item.batchNumber?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Batch number is required for every item",
          },
          { status: 400 }
        );
      }

      if (!item.expiryDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Expiry date is required for every item",
          },
          { status: 400 }
        );
      }

      if (
        item.manufacturingDate &&
        new Date(item.manufacturingDate) >
          new Date(item.expiryDate)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Manufacturing date cannot be after expiry date",
          },
          { status: 400 }
        );
      }

      const quantity = Number(item.quantity);

      const purchasePrice =
        Number(item.purchasePrice);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Quantity must be a positive whole number",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isFinite(purchasePrice) ||
        purchasePrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Purchase price must be a valid positive number",
          },
          { status: 400 }
        );
      }

      const total = Number(
        (quantity * purchasePrice).toFixed(2)
      );

      subtotal += total;

      purchaseItems.push({
        medicine: item.medicine,

        batchNumber:
          item.batchNumber.trim(),

        manufacturingDate:
          item.manufacturingDate
            ? new Date(
                item.manufacturingDate
              )
            : undefined,

        expiryDate: new Date(
          item.expiryDate
        ),

        quantity,

        purchasePrice,

        total,
      });
    }

    const taxAmount = Number(tax) || 0;

    if (taxAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax cannot be negative",
        },
        { status: 400 }
      );
    }

    const grandTotal = Number(
      (subtotal + taxAmount).toFixed(2)
    );

    // Create purchase

    const purchase = await Purchase.create({
      purchaseNumber:
        purchaseNumber.trim(),

      supplier: selectedSupplier._id,

      // Snapshot supplier details
      // for backward compatibility and invoice history
      supplierName:
        selectedSupplier.supplierName,

      supplierPhone:
        selectedSupplier.phone ||
        supplierPhone?.trim() ||
        undefined,

      invoiceNumber:
        invoiceNumber?.trim() ||
        undefined,

      purchaseDate: purchaseDate
        ? new Date(purchaseDate)
        : new Date(),

      status: status || "DRAFT",

      items: purchaseItems,

      subtotal: Number(
        subtotal.toFixed(2)
      ),

      tax: taxAmount,

      grandTotal,

      note:
        note?.trim() ||
        undefined,
    });

    const populatedPurchase =
      await Purchase.findById(
        purchase._id
      )
        .populate(
          "supplier",
          "supplierName companyName phone email gstin contactPerson paymentTerms"
        )
        .populate(
          "items.medicine",
          "name genericName company strength dosageForm"
        )
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          "Purchase created successfully",
        purchase: populatedPurchase,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/purchases error:",
      error
    );

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase number already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create purchase",
      },
      { status: 500 }
    );
  }
}

