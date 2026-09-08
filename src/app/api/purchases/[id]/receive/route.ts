

import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import MedicineBatch from "@/models/MedicineBatch";
import StockMovement from "@/models/StockMovement";
import Medicine from "@/models/Medicine";

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

    const purchase = await Purchase.findById(id);

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase not found",
        },
        { status: 404 }
      );
    }

    // Prevent duplicate receiving
    if (purchase.status === "RECEIVED") {
      return NextResponse.json(
        {
          success: false,
          message: "This purchase has already been received",
        },
        { status: 400 }
      );
    }

    if (purchase.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled purchase cannot be received",
        },
        { status: 400 }
      );
    }

    if (!purchase.items || purchase.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase has no items",
        },
        { status: 400 }
      );
    }

    /*
     * Validate every item BEFORE changing stock.
     * This prevents obvious invalid data from partially
     * updating the inventory.
     */
    for (const item of purchase.items) {
      const medicine = await Medicine.findOne({
        _id: item.medicine,
        isActive: true,
      });

      if (!medicine) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more medicines in this purchase are inactive or missing",
          },
          { status: 400 }
        );
      }

      if (!item.batchNumber?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Batch number is missing for one or more purchase items",
          },
          { status: 400 }
        );
      }

      if (!item.expiryDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Expiry date is missing for one or more purchase items",
          },
          { status: 400 }
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Purchase quantity must be a positive whole number",
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
    }

    /*
     * Process every purchase item.
     */
    const receivedItems = [];

    for (const item of purchase.items) {
      /*
       * Find existing active batch for the same medicine
       * and batch number.
       */
      const existingBatch = await MedicineBatch.findOne({
        medicine: item.medicine,
        batchNumber: item.batchNumber.trim(),
        isActive: true,
      });

      let batch;

      if (existingBatch) {
        /*
         * Existing batch:
         * Increase current stock.
         */
        existingBatch.currentStock += item.quantity;

        /*
         * Keep the existing batch dates.
         * Purchase details already contain the dates used
         * when the batch was first created.
         */
        await existingBatch.save();

        batch = existingBatch;
      } else {
        /*
         * New batch:
         * Create it with the received quantity as both
         * initialStock and currentStock.
         */
        batch = await MedicineBatch.create({
          medicine: item.medicine,
          batchNumber: item.batchNumber.trim(),
          manufacturingDate: item.manufacturingDate
            ? new Date(item.manufacturingDate)
            : undefined,
          expiryDate: new Date(item.expiryDate),
          initialStock: item.quantity,
          currentStock: item.quantity,
          isActive: true,
        });
      }

      /*
       * Create Stock Movement.
       */
      const movement = await StockMovement.create({
        medicine: item.medicine,
        batch: batch._id,
        type: "IN",
        quantity: item.quantity,
        reason: "Purchase",
        reference: purchase.purchaseNumber,
        note: `Purchase ${purchase.purchaseNumber}`,
        movementDate: purchase.purchaseDate || new Date(),
      });

      receivedItems.push({
        medicine: item.medicine,
        batch: batch._id,
        quantity: item.quantity,
        movement: movement._id,
      });
    }

    /*
     * Only after all items have been processed,
     * mark the purchase as RECEIVED.
     */
    purchase.status = "RECEIVED";

    await purchase.save();

    const updatedPurchase = await Purchase.findById(id)
      .populate(
        "items.medicine",
        "name genericName company category strength dosageForm rack shelf purchasePrice sellingPrice"
      )
      .lean();

    return NextResponse.json({
      success: true,
      message:
        "Purchase received successfully and stock updated",
      purchase: updatedPurchase,
      receivedItems,
    });
  } catch (error) {
    console.error(
      "POST /api/purchases/[id]/receive error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to receive purchase",
      },
      { status: 500 }
    );
  }
}

