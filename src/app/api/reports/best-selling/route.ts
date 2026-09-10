

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Sale from "@/models/Sale";

type Period =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "CUSTOM";

function getDateRange(
  period: Period,
  from?: string,
  to?: string
) {
  const now = new Date();

  let startDate: Date;
  let endDate: Date;

  if (period === "DAILY") {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
  } else if (period === "WEEKLY") {
    const day = now.getDay();

    const diff =
      day === 0 ? -6 : 1 - day;

    startDate = new Date(now);

    startDate.setDate(
      now.getDate() + diff
    );

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    endDate = new Date(startDate);

    endDate.setDate(
      startDate.getDate() + 6
    );

    endDate.setHours(
      23,
      59,
      59,
      999
    );
  } else if (period === "MONTHLY") {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
  } else {
    if (!from || !to) {
      throw new Error(
        "From and to dates are required"
      );
    }

    startDate = new Date(
      `${from}T00:00:00`
    );

    endDate = new Date(
      `${to}T23:59:59.999`
    );

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      throw new Error(
        "Invalid custom date range"
      );
    }

    if (startDate > endDate) {
      throw new Error(
        "From date cannot be after to date"
      );
    }
  }

  return {
    startDate,
    endDate,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const period =
      (searchParams.get("period") ||
        "MONTHLY") as Period;

    const from =
      searchParams.get("from") ||
      undefined;

    const to =
      searchParams.get("to") ||
      undefined;

    const limitParam =
      Number(
        searchParams.get("limit") || 20
      );

    const limit =
      Number.isFinite(limitParam) &&
      limitParam > 0
        ? Math.min(
            Math.floor(limitParam),
            100
          )
        : 20;

    const allowedPeriods: Period[] = [
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "CUSTOM",
    ];

    if (
      !allowedPeriods.includes(period)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid report period",
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

    const sales = await Sale.find({
      status: "COMPLETED",
      saleDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .select(
        "items subtotal discount tax grandTotal"
      )
      .lean();

    const medicineMap = new Map<
      string,
      {
        medicineId: string;
        medicineName: string;
        genericName: string;
        quantitySold: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const medicineId =
          item.medicine?.toString() ||
          item.medicineName;

        const quantity =
          Number(
            item.quantity || 0
          );

        const sellingPrice =
          Number(
            item.sellingPrice || 0
          );

        const itemTotal =
          Number(item.total || 0);

        /*
         * Revenue comes from the actual
         * sale item total.
         */

        const revenue =
          itemTotal ||
          quantity * sellingPrice;

        /*
         * Purchase price is not always stored
         * inside SaleItem, so best-selling
         * report focuses primarily on sales.
         *
         * Cost/profit are kept as zero when
         * purchase cost is unavailable.
         */

        const cost = 0;

        const profit =
          revenue - cost;

        const existing =
          medicineMap.get(
            medicineId
          );

        if (existing) {
          existing.quantitySold +=
            quantity;

          existing.revenue +=
            revenue;

          existing.cost += cost;

          existing.profit +=
            profit;
        } else {
          medicineMap.set(
            medicineId,
            {
              medicineId,

              medicineName:
                item.medicineName,

              genericName:
                item.genericName || "",

              quantitySold:
                quantity,

              revenue,

              cost,

              profit,
            }
          );
        }
      });
    });

    const bestSelling =
      Array.from(
        medicineMap.values()
      )
        .map((item) => ({
          ...item,

          profitMargin:
            item.revenue > 0
              ? (item.profit /
                  item.revenue) *
                100
              : 0,
        }))
        .sort(
          (a, b) =>
            b.quantitySold -
            a.quantitySold
        )
        .slice(0, limit)
        .map(
          (item, index) => ({
            rank: index + 1,
            ...item,
          })
        );

    const totalQuantitySold =
      Array.from(
        medicineMap.values()
      ).reduce(
        (sum, item) =>
          sum + item.quantitySold,
        0
      );

    const totalRevenue =
      Array.from(
        medicineMap.values()
      ).reduce(
        (sum, item) =>
          sum + item.revenue,
        0
      );

    const totalMedicinesSold =
      medicineMap.size;

    return NextResponse.json(
      {
        success: true,

        period,

        dateRange: {
          from:
            startDate.toISOString(),

          to:
            endDate.toISOString(),
        },

        summary: {
          totalMedicinesSold,
          totalQuantitySold,
          totalRevenue,
        },

        bestSelling,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/reports/best-selling error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate best-selling report",
      },
      { status: 500 }
    );
  }
}

