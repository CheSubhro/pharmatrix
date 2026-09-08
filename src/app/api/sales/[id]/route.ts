

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Sale from "@/models/Sale";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get single sale
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const sale = await Sale.findById(id)
      .populate(
        "items.medicine",
        "name genericName company strength dosageForm"
      )
      .populate(
        "items.batch",
        "batchNumber expiryDate"
      )
      .lean();

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          message: "Sale not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        sale,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/sales/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sale",
      },
      { status: 500 }
    );
  }
}

