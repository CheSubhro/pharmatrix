

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Sale from "@/models/Sale";
import MedicineBatch from "@/models/MedicineBatch";

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
    startDate.setHours(0, 0, 0, 0);

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

    startDate = new Date(`${from}T00:00:00`);
    endDate = new Date(`${to}T23:59:59.999`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
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
        "DAILY") as Period;

    const from =
      searchParams.get("from") ||
      undefined;

    const to =
      searchParams.get("to") ||
      undefined;

    const allowedPeriods: Period[] = [
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "CUSTOM",
    ];

    if (!allowedPeriods.includes(period)) {
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
      .populate(
        "customer",
        "customerName phone"
      )
      .populate(
        "items.medicine",
        "name genericName purchasePrice"
      )
      .populate(
        "items.batch",
        "batchNumber purchasePrice"
      )
      .sort({ saleDate: -1 })
      .lean();

    /*
     * We calculate cost of goods sold from the
     * batch purchase price.
     *
     * Each sale item may have a batch reference.
     * If batch purchase price is unavailable,
     * medicine purchase price is used.
     */

    const profitSales = sales.map(
      (sale) => {
        let revenue = 0;
        let cost = 0;
        let totalItems = 0;

        const items = sale.items.map(
          (item) => {
            const quantity =
              Number(item.quantity || 0);

            const sellingPrice =
              Number(
                item.sellingPrice || 0
              );

            const itemTotal =
              Number(item.total || 0);

            const batchPurchasePrice =
              item.batch &&
              typeof item.batch ===
                "object" &&
              "purchasePrice" in item.batch
                ? Number(
                    item.batch.purchasePrice ||
                      0
                  )
                : 0;

            const medicinePurchasePrice =
              item.medicine &&
              typeof item.medicine ===
                "object" &&
              "purchasePrice" in
                item.medicine
                ? Number(
                    item.medicine
                      .purchasePrice || 0
                  )
                : 0;

            const purchasePrice =
              batchPurchasePrice ||
              medicinePurchasePrice;

            const itemCost =
              quantity * purchasePrice;

            const itemRevenue =
              itemTotal ||
              quantity * sellingPrice;

            revenue += itemRevenue;
            cost += itemCost;
            totalItems += quantity;

            return {
              medicineName:
                item.medicineName,

              genericName:
                item.genericName || "",

              batchNumber:
                item.batchNumber || "-",

              quantity,

              sellingPrice,

              purchasePrice,

              revenue:
                itemRevenue,

              cost: itemCost,

              profit:
                itemRevenue - itemCost,
            };
          }
        );

        const discount =
          Number(sale.discount || 0);

        const tax =
          Number(sale.tax || 0);

        /*
         * Gross profit is based on the final
         * bill revenue before/after discount.
         *
         * Since grandTotal includes tax,
         * tax is excluded from profit calculation.
         */

        const netRevenue =
          Number(sale.subtotal || 0) -
          discount;

        const grossProfit =
          netRevenue - cost;

        return {
          _id: sale._id,
          billNumber:
            sale.billNumber,

          saleDate:
            sale.saleDate,

          customerName:
            sale.customerName ||
            sale.customer?.customerName ||
            "Walk-in Customer",

          totalItems,

          subtotal:
            Number(sale.subtotal || 0),

          discount,

          tax,

          grandTotal:
            Number(sale.grandTotal || 0),

          revenue: netRevenue,

          cost,

          grossProfit,

          profitMargin:
            netRevenue > 0
              ? (grossProfit /
                  netRevenue) *
                100
              : 0,

          paymentMethod:
            sale.paymentMethod,

          items,
        };
      }
    );

    const totalBills =
      profitSales.length;

    const totalItems =
      profitSales.reduce(
        (sum, sale) =>
          sum + sale.totalItems,
        0
      );

    const totalSales =
      profitSales.reduce(
        (sum, sale) =>
          sum + sale.subtotal,
        0
      );

    const totalDiscount =
      profitSales.reduce(
        (sum, sale) =>
          sum + sale.discount,
        0
      );

    const totalTax =
      profitSales.reduce(
        (sum, sale) =>
          sum + sale.tax,
        0
      );

    const totalRevenue =
      profitSales.reduce(
        (sum, sale) =>
          sum + sale.revenue,
        0
      );

    const totalCost =
      profitSales.reduce(
        (sum, sale) =>
          sum + sale.cost,
        0
      );

    const grossProfit =
      totalRevenue - totalCost;

    const profitMargin =
      totalRevenue > 0
        ? (grossProfit /
            totalRevenue) *
          100
        : 0;

    /*
     * Medicine-wise profit summary
     */

    const medicineMap = new Map<
      string,
      {
        medicineName: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    profitSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key =
          item.medicineName;

        const existing =
          medicineMap.get(key);

        if (existing) {
          existing.quantity +=
            item.quantity;

          existing.revenue +=
            item.revenue;

          existing.cost +=
            item.cost;

          existing.profit +=
            item.profit;
        } else {
          medicineMap.set(key, {
            medicineName:
              item.medicineName,

            quantity:
              item.quantity,

            revenue:
              item.revenue,

            cost:
              item.cost,

            profit:
              item.profit,
          });
        }
      });
    });

    const medicineSummary =
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
            b.profit - a.profit
        );

    /*
     * NOTE:
     * MedicineBatch import is intentionally kept
     * available for future batch-level reporting.
     * Current profit calculation uses populated
     * batch purchase price directly from sale items.
     */

    void MedicineBatch;

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
          totalBills,
          totalItems,

          totalSales,

          totalDiscount,

          totalTax,

          totalRevenue,

          totalCost,

          grossProfit,

          profitMargin,
        },

        sales: profitSales,

        medicineSummary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/reports/profit error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate profit report",
      },
      { status: 500 }
    );
  }
}

