

import { NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";

export async function GET() {
  try {
    await connectDB();

    /*
     * ---------------------------------------------------------
     * LOW STOCK
     * ---------------------------------------------------------
     */

    const medicines = await Medicine.find({
      isActive: true,
    })
      .select(
        "_id name genericName company minimumStock"
      )
      .lean();

    const activeBatches = await MedicineBatch.find({
      isActive: true,
      stock: { $gt: 0 },
    })
      .select(
        "_id medicine stock expiryDate batchNumber"
      )
      .lean();

    const stockMap = new Map<string, number>();

    for (const batch of activeBatches) {
      const medicineId =
        batch.medicine?.toString();

      if (!medicineId) continue;

      stockMap.set(
        medicineId,
        (stockMap.get(medicineId) || 0) +
          Number(batch.stock || 0)
      );
    }

    const lowStockNotifications =
      medicines
        .map((medicine) => {
          const currentStock =
            stockMap.get(
              medicine._id.toString()
            ) || 0;

          if (
            currentStock >
            Number(medicine.minimumStock || 0)
          ) {
            return null;
          }

          return {
            id: `low-stock-${medicine._id}`,
            type: "LOW_STOCK" as const,
            title: "Low Stock",
            message:
              currentStock <= 0
                ? `${medicine.name} is out of stock.`
                : `${medicine.name} is running low.`,
            medicineId:
              medicine._id.toString(),
            medicineName: medicine.name,
            genericName:
              medicine.genericName,
            company: medicine.company,
            currentStock,
            minimumStock:
              Number(
                medicine.minimumStock || 0
              ),
            severity:
              currentStock <= 0
                ? "HIGH"
                : "MEDIUM",
          };
        })
        .filter(Boolean);

    /*
     * ---------------------------------------------------------
     * EXPIRY ALERT
     * ---------------------------------------------------------
     *
     * Expired:
     * daysLeft < 0
     *
     * Near Expiry:
     * 0 - 30 days
     *
     * ---------------------------------------------------------
     */

    const expiryBatches =
      await MedicineBatch.find({
        isActive: true,
        stock: { $gt: 0 },
      })
        .populate(
          "medicine",
          "name genericName company"
        )
        .select(
          "_id medicine stock expiryDate batchNumber"
        )
        .lean();

    const now = new Date();

    const expiryNotifications =
      expiryBatches
        .map((batch) => {
          if (!batch.expiryDate) {
            return null;
          }

          const expiryDate =
            new Date(batch.expiryDate);

          const difference =
            expiryDate.getTime() -
            now.getTime();

          const daysLeft = Math.ceil(
            difference /
              (1000 * 60 * 60 * 24)
          );

          if (daysLeft > 30) {
            return null;
          }

          const medicine =
            batch.medicine as
              | {
                  _id?: unknown;
                  name?: string;
                  genericName?: string;
                  company?: string;
                }
              | null;

          const isExpired =
            daysLeft < 0;

          return {
            id: `expiry-${batch._id}`,
            type: "EXPIRY_ALERT" as const,
            title: isExpired
              ? "Expired Medicine"
              : "Expiry Alert",
            message: isExpired
              ? `${medicine?.name || "Medicine"} has expired.`
              : `${medicine?.name || "Medicine"} expires soon.`,
            medicineId:
              medicine?._id?.toString(),
            medicineName:
              medicine?.name || "Medicine",
            genericName:
              medicine?.genericName,
            company:
              medicine?.company,
            batchId:
              batch._id.toString(),
            batchNumber:
              batch.batchNumber,
            stock: Number(batch.stock || 0),
            expiryDate:
              expiryDate.toISOString(),
            daysLeft,
            severity: isExpired
              ? "HIGH"
              : "MEDIUM",
          };
        })
        .filter(Boolean);

    /*
     * ---------------------------------------------------------
     * COMBINE
     * ---------------------------------------------------------
     */

    const notifications = [
      ...expiryNotifications,
      ...lowStockNotifications,
    ];

    /*
     * Highest priority first
     */

    notifications.sort((a, b) => {
      const severityOrder = {
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
      };

      return (
        severityOrder[
          a!.severity as keyof typeof severityOrder
        ] -
        severityOrder[
          b!.severity as keyof typeof severityOrder
        ]
      );
    });

    return NextResponse.json(
      {
        success: true,
        notifications,
        summary: {
          total: notifications.length,
          lowStock:
            lowStockNotifications.length,
          expiry:
            expiryNotifications.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}

