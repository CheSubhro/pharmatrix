
import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import MedicineBatch from "@/models/MedicineBatch";
import StockMovement from "@/models/StockMovement";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const batch = await MedicineBatch.findById(id);

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          message: "Medicine batch not found",
        },
        { status: 404 }
      );
    }

    if (!batch.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "This batch is inactive",
        },
        { status: 400 }
      );
    }

    const today = new Date();

    const expiryDate = new Date(batch.expiryDate);

    const expiryDay = new Date(
      expiryDate.getFullYear(),
      expiryDate.getMonth(),
      expiryDate.getDate()
    );

    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (expiryDay >= todayDay) {
      return NextResponse.json(
        {
          success: false,
          message: "This batch has not expired yet",
        },
        { status: 400 }
      );
    }

    if (batch.currentStock <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This batch has no remaining stock",
        },
        { status: 400 }
      );
    }

    const quantityToRemove = batch.currentStock;

    batch.currentStock = 0;

    await batch.save();

    await StockMovement.create({
      medicine: batch.medicine,
      batch: batch._id,
      type: "OUT",
      quantity: quantityToRemove,
      reason: "Expired",
      reference: batch.batchNumber,
      note: `Expired stock removed from batch ${batch.batchNumber}`,
      movementDate: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Expired stock removed successfully",
      removedQuantity: quantityToRemove,
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      currentStock: batch.currentStock,
    });
  } catch (error) {
    console.error(
      "POST /api/expiry-management/[id]/remove-stock error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove expired stock",
      },
      { status: 500 }
    );
  }
}

