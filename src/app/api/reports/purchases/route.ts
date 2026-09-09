

import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";

function getDateRange(
  period: string,
  from?: string,
  to?: string
) {
  const now = new Date();

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

    const mondayOffset =
      day === 0 ? -6 : 1 - day;

    startDate.setDate(
      startDate.getDate() + mondayOffset
    );
    startDate.setHours(0, 0, 0, 0);

    endDate.setTime(startDate.getTime());
    endDate.setDate(
      startDate.getDate() + 6
    );
    endDate.setHours(23, 59, 59, 999);
  }

  if (period === "MONTHLY") {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    endDate.setMonth(
      endDate.getMonth() + 1
    );
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const period =
      searchParams.get("period") ||
      "DAILY";

    const from =
      searchParams.get("from") ||
      undefined;

    const to =
      searchParams.get("to") ||
      undefined;

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

    if (
      period === "CUSTOM" &&
      (!from || !to)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "From and to dates are required",
        },
        { status: 400 }
      );
    }

    const {
      startDate,
      endDate,
    } = getDateRange(
      period,
      from,
      to
    );

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
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

    const purchases =
      await Purchase.find({
        purchaseDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate(
          "supplier",
          "supplierName phone email"
        )
        .sort({
          purchaseDate: -1,
        })
        .lean();

    const totalInvoices =
      purchases.length;

    const totalItems =
      purchases.reduce(
        (sum, purchase) => {
          return (
            sum +
            (purchase.items || []).reduce(
              (
                itemSum,
                item
              ) =>
                itemSum +
                Number(
                  item.quantity || 0
                ),
              0
            )
          );
        },
        0
      );

    const totalPurchaseAmount =
      purchases.reduce(
        (sum, purchase) =>
          sum +
          Number(
            purchase.totalAmount || 0
          ),
        0
      );

    const receivedPurchases =
      purchases.filter(
        (purchase) =>
          purchase.status ===
          "RECEIVED"
      );

    const pendingPurchases =
      purchases.filter(
        (purchase) =>
          purchase.status ===
          "PENDING"
      );

    const receivedAmount =
      receivedPurchases.reduce(
        (sum, purchase) =>
          sum +
          Number(
            purchase.totalAmount ||
              0
          ),
        0
      );

    const pendingAmount =
      pendingPurchases.reduce(
        (sum, purchase) =>
          sum +
          Number(
            purchase.totalAmount ||
              0
          ),
        0
      );

    // Supplier-wise summary
    const supplierMap =
      new Map<
        string,
        {
          supplierName: string;
          invoiceCount: number;
          totalAmount: number;
        }
      >();

    purchases.forEach(
      (purchase) => {
        const supplierName =
          purchase.supplier
            ?.supplierName ||
          purchase.supplierName ||
          "Unknown Supplier";

        const supplierId =
          purchase.supplier?._id?.toString() ||
          supplierName;

        const existing =
          supplierMap.get(
            supplierId
          );

        if (existing) {
          existing.invoiceCount += 1;
          existing.totalAmount +=
            Number(
              purchase.totalAmount ||
                0
            );
        } else {
          supplierMap.set(
            supplierId,
            {
              supplierName,
              invoiceCount: 1,
              totalAmount:
                Number(
                  purchase.totalAmount ||
                    0
                ),
            }
          );
        }
      }
    );

    const supplierSummary =
      Array.from(
        supplierMap.values()
      ).sort(
        (a, b) =>
          b.totalAmount -
          a.totalAmount
      );

    return NextResponse.json(
      {
        success: true,

        period,

        dateRange: {
          from: startDate,
          to: endDate,
        },

        summary: {
          totalInvoices,
          totalItems,
          totalPurchaseAmount,
          receivedInvoices:
            receivedPurchases.length,
          receivedAmount,
          pendingInvoices:
            pendingPurchases.length,
          pendingAmount,
        },

        supplierSummary,

        purchases,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/reports/purchases error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate purchase report",
      },
      { status: 500 }
    );
  }
}

