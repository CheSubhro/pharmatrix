

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Sale from "@/models/Sale";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Check customer
    const customer = await Customer.findById(id)
      .select("customerName phone email address")
      .lean();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // Fetch completed sales for this customer
    const sales = await Sale.find({
      customer: id,
      status: "COMPLETED",
    })
      .populate(
        "items.medicine",
        "name genericName company strength dosageForm"
      )
      .populate(
        "items.batch",
        "batchNumber expiryDate"
      )
      .sort({ saleDate: -1 })
      .lean();

    // Summary
    const totalBills = sales.length;

    const totalPurchaseAmount = sales.reduce(
      (sum, sale) => sum + Number(sale.grandTotal || 0),
      0
    );

    const totalItems = sales.reduce(
      (sum, sale) =>
        sum +
        sale.items.reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    const latestPurchaseDate =
      sales.length > 0 ? sales[0].saleDate : null;

    return NextResponse.json(
      {
        success: true,
        customer,
        summary: {
          totalBills,
          totalPurchaseAmount,
          totalItems,
          latestPurchaseDate,
        },
        purchases: sales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/customers/[id]/purchases error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer purchase history",
      },
      { status: 500 }
    );
  }
}

