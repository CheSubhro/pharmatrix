

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Sale from "@/models/Sale";

function getDateRange(period: string, from?: string, to?: string) {
  const now = new Date();

  // Custom date range
  if (period === "CUSTOM" && from && to) {
    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59.999`);

    return { startDate, endDate };
  }

  const startDate = new Date(now);
  const endDate = new Date(now);

  if (period === "DAILY") {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  if (period === "WEEKLY") {
    const day = startDate.getDay();

    // Monday = 0 ... Sunday = 6
    const mondayOffset = day === 0 ? -6 : 1 - day;

    startDate.setDate(startDate.getDate() + mondayOffset);
    startDate.setHours(0, 0, 0, 0);

    endDate.setTime(startDate.getTime());
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  }

  if (period === "MONTHLY") {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const period =
      searchParams.get("period") || "DAILY";

    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const allowedPeriods = [
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "CUSTOM",
    ];

    if (!allowedPeriods.includes(period)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report period",
        },
        { status: 400 }
      );
    }

    const { startDate, endDate } = getDateRange(
      period,
      from,
      to
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date range",
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Start date cannot be greater than end date",
        },
        { status: 400 }
      );
    }

    const sales = await Sale.find({
      status: "COMPLETED",
      saleDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate(
        "customer",
        "customerName phone"
      )
      .sort({
        saleDate: -1,
      })
      .lean();

    const totalBills = sales.length;

    const subtotal = sales.reduce(
      (sum, sale) => sum + Number(sale.subtotal || 0),
      0
    );

    const discount = sales.reduce(
      (sum, sale) => sum + Number(sale.discount || 0),
      0
    );

    const tax = sales.reduce(
      (sum, sale) => sum + Number(sale.tax || 0),
      0
    );

    const grandTotal = sales.reduce(
      (sum, sale) => sum + Number(sale.grandTotal || 0),
      0
    );

    const totalItems = sales.reduce(
      (sum, sale) =>
        sum +
        (sale.items || []).reduce(
          (itemSum, item) =>
            itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    const paymentSummary = {
      cash: sales
        .filter(
          (sale) => sale.paymentMethod === "CASH"
        )
        .reduce(
          (sum, sale) =>
            sum + Number(sale.grandTotal || 0),
          0
        ),

      upi: sales
        .filter(
          (sale) => sale.paymentMethod === "UPI"
        )
        .reduce(
          (sum, sale) =>
            sum + Number(sale.grandTotal || 0),
          0
        ),

      card: sales
        .filter(
          (sale) => sale.paymentMethod === "CARD"
        )
        .reduce(
          (sum, sale) =>
            sum + Number(sale.grandTotal || 0),
          0
        ),

      credit: sales
        .filter(
          (sale) => sale.paymentMethod === "CREDIT"
        )
        .reduce(
          (sum, sale) =>
            sum + Number(sale.grandTotal || 0),
          0
        ),
    };

    return NextResponse.json(
      {
        success: true,

        period,

        dateRange: {
          from: startDate,
          to: endDate,
        },

        summary: {
          totalBills,
          totalItems,
          subtotal,
          discount,
          tax,
          grandTotal,
        },

        paymentSummary,

        sales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/reports/sales error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate sales report",
      },
      { status: 500 }
    );
  }
}

