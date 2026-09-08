

import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import Purchase from "@/models/Purchase";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const purchase = await Purchase.findById(id)
      .populate(
        "items.medicine",
        "name genericName company category strength dosageForm rack shelf purchasePrice sellingPrice"
      )
      .lean();

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      purchase,
    });
  } catch (error) {
    console.error("GET /api/purchases/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch purchase",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    const { status } = body;

    const allowedStatuses = [
      "DRAFT",
      "ORDERED",
      "RECEIVED",
      "CANCELLED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid purchase status",
        },
        { status: 400 }
      );
    }

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

    // Once received, purchase should not be changed again.
    if (purchase.status === "RECEIVED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Received purchase cannot be modified",
        },
        { status: 400 }
      );
    }

    // Cancelled purchase cannot be reopened.
    if (
      purchase.status === "CANCELLED" &&
      status !== "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cancelled purchase cannot be reopened",
        },
        { status: 400 }
      );
    }

    // Directly marking a purchase as RECEIVED is not allowed.
    // It must go through the receive API so stock is updated.
    if (status === "RECEIVED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Use the Receive Purchase action to mark a purchase as received",
        },
        { status: 400 }
      );
    }

    purchase.status = status;

    await purchase.save();

    const updatedPurchase = await Purchase.findById(id)
      .populate(
        "items.medicine",
        "name genericName company category strength dosageForm rack shelf purchasePrice sellingPrice"
      )
      .lean();

    return NextResponse.json({
      success: true,
      message: "Purchase status updated successfully",
      purchase: updatedPurchase,
    });
  } catch (error) {
    console.error("PUT /api/purchases/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update purchase",
      },
      { status: 500 }
    );
  }
}

