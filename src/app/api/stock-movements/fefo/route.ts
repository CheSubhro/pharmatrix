

import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";
import StockMovement from "@/models/StockMovement";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      medicine: medicineId,
      quantity,
      reason = "Sale",
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

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a positive whole number",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Validate medicine
    // -----------------------------

    const medicine = await Medicine.findOne({
      _id: medicineId,
      isActive: true,
    }).lean();

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
    // Find active batches
    // Earliest expiry first = FEFO
    // -----------------------------

    const batches = await MedicineBatch.find({
      medicine: medicineId,
      isActive: true,
      currentStock: { $gt: 0 },
    })
      .sort({
        expiryDate: 1,
        createdAt: 1,
      })
      .lean();

    if (batches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No stock available for this medicine",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Check total available stock
    // -----------------------------

    const totalAvailableStock = batches.reduce(
      (total, batch) => total + Number(batch.currentStock || 0),
      0
    );

    if (requestedQuantity > totalAvailableStock) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Insufficient stock. Available stock: ${totalAvailableStock}, ` +
            `requested: ${requestedQuantity}`,
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // FEFO allocation
    // -----------------------------

    let remainingQuantity = requestedQuantity;

    const allocations: {
      batchId: string;
      batchNumber: string;
      expiryDate: Date;
      quantity: number;
      remainingStock: number;
    }[] = [];

    for (const batch of batches) {
      if (remainingQuantity <= 0) {
        break;
      }

      const availableInBatch = Number(batch.currentStock || 0);

      const quantityFromBatch = Math.min(
        remainingQuantity,
        availableInBatch
      );

      remainingQuantity -= quantityFromBatch;

      allocations.push({
        batchId: batch._id.toString(),
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: quantityFromBatch,
        remainingStock: availableInBatch - quantityFromBatch,
      });
    }

    // Safety check
    if (remainingQuantity > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to allocate requested quantity",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Update batches + create movements
    // -----------------------------

    const movements = [];

    for (const allocation of allocations) {
      const batch = await MedicineBatch.findById(
        allocation.batchId
      );

      if (!batch) {
        throw new Error(
          `Batch ${allocation.batchNumber} no longer exists`
        );
      }

      // Re-check stock before updating
      if (batch.currentStock < allocation.quantity) {
        throw new Error(
          `Insufficient stock in batch ${allocation.batchNumber}`
        );
      }

      batch.currentStock -= allocation.quantity;

      await batch.save();

      const movement = await StockMovement.create({
        medicine: medicineId,
        batch: batch._id,
        type: "OUT",
        quantity: allocation.quantity,
        reason,
        reference,
        note:
          note ||
          `FEFO stock OUT from batch ${allocation.batchNumber}`,
        movementDate: movementDate
          ? new Date(movementDate)
          : new Date(),
      });

      movements.push({
        _id: movement._id,
        batch: allocation.batchNumber,
        expiryDate: allocation.expiryDate,
        quantity: allocation.quantity,
        remainingStock: batch.currentStock,
      });
    }

    // -----------------------------
    // Final stock
    // -----------------------------

    const updatedBatches = await MedicineBatch.find({
      medicine: medicineId,
      isActive: true,
    })
      .sort({
        expiryDate: 1,
        createdAt: 1,
      })
      .lean();

    const totalRemainingStock = updatedBatches.reduce(
      (total, batch) => total + Number(batch.currentStock || 0),
      0
    );

    return NextResponse.json({
      success: true,

      message: "FEFO stock OUT completed successfully",

      medicine: {
        _id: medicine._id,
        name: medicine.name,
      },

      requestedQuantity,

      totalRemoved: requestedQuantity,

      totalRemainingStock,

      allocations,

      movements,
    });
  } catch (error) {
    console.error("POST /api/stock-movements/fefo error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process FEFO stock OUT",
      },
      { status: 500 }
    );
  }
}

