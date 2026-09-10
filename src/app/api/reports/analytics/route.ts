

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";

type Period = "DAILY" | "WEEKLY" | "MONTHLY";

function getDateRange(period: Period) {
  const now = new Date();

  const start = new Date(now);
  const end = new Date(now);

  if (period === "DAILY") {
    start.setHours(0, 0, 0, 0);

    end.setHours(23, 59, 59, 999);
  }

  if (period === "WEEKLY") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "MONTHLY") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getDateKeys(start: Date, end: Date) {
  const keys: string[] = [];

  const current = new Date(start);

  while (current <= end) {
    keys.push(formatDate(current));

    current.setDate(current.getDate() + 1);
  }

  return keys;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;

    const periodParam =
      searchParams.get("period") || "MONTHLY";

    const allowedPeriods: Period[] = [
      "DAILY",
      "WEEKLY",
      "MONTHLY",
    ];

    if (
      !allowedPeriods.includes(
        periodParam as Period
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid period. Use DAILY, WEEKLY or MONTHLY.",
        },
        { status: 400 }
      );
    }

    const period = periodParam as Period;

    const { start, end } = getDateRange(period);

    const [sales, purchases] = await Promise.all([
      Sale.find({
        status: "COMPLETED",
        saleDate: {
          $gte: start,
          $lte: end,
        },
      })
        .select(
          "saleDate grandTotal items"
        )
        .lean(),

      Purchase.find({
        purchaseDate: {
          $gte: start,
          $lte: end,
        },
      })
        .select(
          "purchaseDate totalAmount status items"
        )
        .lean(),
    ]);

    const dateKeys = getDateKeys(start, end);

    const salesByDate = dateKeys.map((date) => ({
      date,
      sales: 0,
      bills: 0,
      items: 0,
    }));

    const purchasesByDate = dateKeys.map(
      (date) => ({
        date,
        purchases: 0,
        invoices: 0,
      })
    );

    const salesMap = new Map(
      salesByDate.map((item) => [
        item.date,
        item,
      ])
    );

    const purchasesMap = new Map(
      purchasesByDate.map((item) => [
        item.date,
        item,
      ])
    );

    const medicineMap = new Map<
      string,
      {
        medicineName: string;
        quantitySold: number;
        revenue: number;
      }
    >();

    for (const sale of sales) {
      const saleDate = new Date(
        sale.saleDate
      );

      const key = formatDate(saleDate);

      const day = salesMap.get(key);

      if (day) {
        day.sales += Number(
          sale.grandTotal || 0
        );

        day.bills += 1;

        const itemCount =
          sale.items?.reduce(
            (
              sum: number,
              item: {
                quantity?: number;
              }
            ) =>
              sum +
              Number(item.quantity || 0),
            0
          ) || 0;

        day.items += itemCount;
      }

      for (const item of sale.items || []) {
        const medicineName =
          item.medicineName ||
          "Unknown Medicine";

        const quantity = Number(
          item.quantity || 0
        );

        const revenue = Number(
          item.total ||
            quantity *
              Number(
                item.sellingPrice || 0
              )
        );

        const existing =
          medicineMap.get(medicineName);

        if (existing) {
          existing.quantitySold +=
            quantity;

          existing.revenue += revenue;
        } else {
          medicineMap.set(medicineName, {
            medicineName,
            quantitySold: quantity,
            revenue,
          });
        }
      }
    }

    for (const purchase of purchases) {
      const purchaseDate = new Date(
        purchase.purchaseDate
      );

      const key = formatDate(purchaseDate);

      const day =
        purchasesMap.get(key);

      if (!day) {
        continue;
      }

      day.invoices += 1;

      day.purchases += Number(
        purchase.totalAmount || 0
      );
    }

    const topMedicines = Array.from(
      medicineMap.values()
    )
      .sort(
        (a, b) =>
          b.quantitySold -
          a.quantitySold
      )
      .slice(0, 10)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    const totalSales = sales.reduce(
      (sum, sale) =>
        sum +
        Number(sale.grandTotal || 0),
      0
    );

    const totalPurchases =
      purchases.reduce(
        (sum, purchase) =>
          sum +
          Number(
            purchase.totalAmount || 0
          ),
        0
      );

    const totalItemsSold =
      sales.reduce(
        (sum, sale) =>
          sum +
          (sale.items?.reduce(
            (
              itemSum: number,
              item: {
                quantity?: number;
              }
            ) =>
              itemSum +
              Number(
                item.quantity || 0
              ),
            0
          ) || 0),
        0
      );

    return NextResponse.json(
      {
        success: true,

        period,

        dateRange: {
          from: start.toISOString(),
          to: end.toISOString(),
        },

        summary: {
          totalSales,
          totalPurchases,
          totalBills: sales.length,
          totalInvoices: purchases.length,
          totalItemsSold,
        },

        salesTrend: salesByDate,

        purchaseTrend: purchasesByDate,

        topMedicines,
      },

      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/reports/analytics error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch analytics report",
      },
      { status: 500 }
    );
  }
}

