
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import StockMovement from "@/models/StockMovement";
import MedicineBatch from "@/models/MedicineBatch";
import Medicine from "@/models/Medicine";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const medicineId = searchParams.get("medicine");
    const batchId = searchParams.get("batch");

    const filter: Record<string, unknown> = {};

    if (medicineId) {
      if (!mongoose.Types.ObjectId.isValid(medicineId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid medicine ID",
          },
          { status: 400 }
        );
      }

      filter.medicine = medicineId;
    }

    if (batchId) {
      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid batch ID",
          },
          { status: 400 }
        );
      }

      filter.batch = batchId;
    }

    const movements = await StockMovement.find(filter)
      .populate(
        "medicine",
        "name genericName company strength dosageForm"
      )
      .populate(
        "batch",
        "batchNumber expiryDate currentStock"
      )
      .sort({ movementDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        movements,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/stock-movements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stock movements",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      medicine: medicineId,
      batch: batchId,
      type,
      quantity,
      reason,
      reference,
      note,
      movementDate,
    } = body;

    // -----------------------------
    // Basic validation
    // -----------------------------

    if (!medicineId) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine is required",
        },
        { status: 400 }
      );
    }

    if (!batchId) {
      return NextResponse.json(
        {
          success: false,
          message: "Batch is required",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(medicineId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid medicine ID",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid batch ID",
        },
        { status: 400 }
      );
    }

    if (type !== "IN" && type !== "OUT") {
      return NextResponse.json(
        {
          success: false,
          message: "Movement type must be IN or OUT",
        },
        { status: 400 }
      );
    }

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity is required",
        },
        { status: 400 }
      );
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(parsedQuantity)) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a whole number",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Validate Medicine
    // -----------------------------

    const medicine = await Medicine.findOne({
      _id: medicineId,
      isActive: true,
    });

    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          message: "Active medicine not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // Validate Batch
    // -----------------------------

    const batch = await MedicineBatch.findOne({
      _id: batchId,
      isActive: true,
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          message: "Active medicine batch not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // Make sure batch belongs
    // to selected medicine
    // -----------------------------

    if (
      batch.medicine.toString() !==
      medicineId.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected batch does not belong to the selected medicine",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Stock OUT validation
    // -----------------------------

    if (
      type === "OUT" &&
      parsedQuantity > batch.currentStock
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient stock. Current stock is ${batch.currentStock}`,
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Validate movement date
    // -----------------------------

    let finalMovementDate = new Date();

    if (movementDate) {
      const parsedDate = new Date(movementDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid movement date",
          },
          { status: 400 }
        );
      }

      finalMovementDate = parsedDate;
    }

    // -----------------------------
    // Calculate new stock
    // -----------------------------

    const previousStock = batch.currentStock;

    const newStock =
      type === "IN"
        ? previousStock + parsedQuantity
        : previousStock - parsedQuantity;

    if (newStock < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Stock cannot become negative",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Update batch stock
    // -----------------------------

    batch.currentStock = newStock;

    await batch.save();

    // -----------------------------
    // Create movement record
    // -----------------------------

    const movement = await StockMovement.create({
      medicine: medicineId,
      batch: batchId,
      type,
      quantity: parsedQuantity,
      reason:
        typeof reason === "string"
          ? reason.trim()
          : undefined,
      reference:
        typeof reference === "string"
          ? reference.trim()
          : undefined,
      note:
        typeof note === "string"
          ? note.trim()
          : undefined,
      movementDate: finalMovementDate,
    });

    // -----------------------------
    // Return populated movement
    // -----------------------------

    const populatedMovement =
      await StockMovement.findById(
        movement._id
      )
        .populate(
          "medicine",
          "name genericName company strength dosageForm"
        )
        .populate(
          "batch",
          "batchNumber expiryDate currentStock"
        )
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          type === "IN"
            ? "Stock added successfully"
            : "Stock removed successfully",
        movement: populatedMovement,
        stock: {
          previousStock,
          quantity: parsedQuantity,
          type,
          currentStock: newStock,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/stock-movements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update stock",
      },
      { status: 500 }
    );
  }
}

