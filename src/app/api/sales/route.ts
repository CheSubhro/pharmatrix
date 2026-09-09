
import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Medicine from "@/models/Medicine";
import MedicineBatch from "@/models/MedicineBatch";
import StockMovement from "@/models/StockMovement";
import Customer from "@/models/Customer";

// GET - Get all sales
export async function GET() {
  try {
    await connectDB();

    const sales = await Sale.find()
      .populate(
        "customer",
        "customerName phone email"
      )
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

    return NextResponse.json(
      {
        success: true,
        sales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/sales error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales",
      },
      { status: 500 }
    );
  }
}

// POST - Create sale and automatically decrease stock using FEFO
export async function POST(request: NextRequest) {
  const stockChanges: Array<{
    batchId: string;
    previousStock: number;
    quantity: number;
    medicineId: string;
    movementId?: string;
  }> = [];

  try {
    await connectDB();

    const body = await request.json();

    const {
      billNumber,
      customer,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      tax,
      grandTotal,
      paymentMethod,
      paymentStatus,
      status,
      saleDate,
      note,
    } = body;

    // -----------------------------
    // Basic validation
    // -----------------------------

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one medicine is required",
        },
        { status: 400 }
      );
    }

    if (subtotal === undefined || Number(subtotal) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid subtotal is required",
        },
        { status: 400 }
      );
    }

    if (grandTotal === undefined || Number(grandTotal) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid grand total is required",
        },
        { status: 400 }
      );
    }

    if (
      paymentMethod &&
      !["CASH", "UPI", "CARD", "CREDIT"].includes(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
        },
        { status: 400 }
      );
    }

    if (
      paymentStatus &&
      !["PAID", "PENDING", "PARTIAL"].includes(
        paymentStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status",
        },
        { status: 400 }
      );
    }

    if (
      status &&
      !["DRAFT", "COMPLETED", "CANCELLED"].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sale status",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Customer validation
    // -----------------------------

    let selectedCustomer = null;

    if (customer) {
      selectedCustomer = await Customer.findOne({
        _id: customer,
        isActive: true,
      }).lean();

      if (!selectedCustomer) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer not found or inactive",
          },
          { status: 404 }
        );
      }
    }

    // -----------------------------
    // For completed sale,
    // payment must be PAID
    // -----------------------------

    if ((status || "DRAFT") === "COMPLETED") {
      if ((paymentMethod || "CASH") !== "CASH") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only CASH payment is currently supported",
          },
          { status: 400 }
        );
      }

      if ((paymentStatus || "PAID") !== "PAID") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment must be PAID before completing sale",
          },
          { status: 400 }
        );
      }
    }

    // -----------------------------
    // Generate bill number
    // -----------------------------

    let finalBillNumber = billNumber?.trim();

    if (!finalBillNumber) {
      finalBillNumber = `BILL-${Date.now()}`;
    }

    // -----------------------------
    // Check duplicate bill number
    // -----------------------------

    const existingSale = await Sale.findOne({
      billNumber: finalBillNumber,
    });

    if (existingSale) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill number already exists",
        },
        { status: 409 }
      );
    }

    // -----------------------------
    // Prepare sale items
    // -----------------------------

    const preparedItems: Array<{
      medicine: any;
      medicineName: string;
      genericName?: string;
      batch?: any;
      batchNumber?: string;
      quantity: number;
      sellingPrice: number;
      taxRate: number;
      discount: number;
      total: number;
    }> = [];

    for (const item of items) {
      if (!item.medicine) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Medicine is required for every item",
          },
          { status: 400 }
        );
      }

      if (!item.quantity || Number(item.quantity) < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Quantity must be at least 1",
          },
          { status: 400 }
        );
      }

      if (
        item.sellingPrice === undefined ||
        Number(item.sellingPrice) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Valid selling price is required",
          },
          { status: 400 }
        );
      }

      if (
        item.taxRate === undefined ||
        Number(item.taxRate) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid tax rate is required",
          },
          { status: 400 }
        );
      }

      if (
        item.discount === undefined ||
        Number(item.discount) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Valid item discount is required",
          },
          { status: 400 }
        );
      }

      if (
        item.total === undefined ||
        Number(item.total) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid item total is required",
          },
          { status: 400 }
        );
      }

      const medicine = await Medicine.findById(
        item.medicine
      ).lean();

      if (!medicine) {
        return NextResponse.json(
          {
            success: false,
            message: `Medicine not found: ${item.medicine}`,
          },
          { status: 404 }
        );
      }

      preparedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        quantity: Number(item.quantity),
        sellingPrice: Number(item.sellingPrice),
        taxRate: Number(item.taxRate),
        discount: Number(item.discount),
        total: Number(item.total),
      });
    }

    // -----------------------------
    // Stock deduction using FEFO
    // Only for COMPLETED sale
    // -----------------------------

    if ((status || "DRAFT") === "COMPLETED") {
      for (const item of preparedItems) {
        let remainingQuantity = item.quantity;

        const batches = await MedicineBatch.find({
          medicine: item.medicine,
          isActive: true,
          currentStock: { $gt: 0 },
          expiryDate: { $gte: new Date() },
        }).sort({
          expiryDate: 1,
          createdAt: 1,
        });

        const totalAvailableStock = batches.reduce(
          (sum, batch) => sum + batch.currentStock,
          0
        );

        if (totalAvailableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.medicineName}. Available: ${totalAvailableStock}, Required: ${item.quantity}`
          );
        }

        for (const batch of batches) {
          if (remainingQuantity <= 0) {
            break;
          }

          const quantityFromBatch = Math.min(
            batch.currentStock,
            remainingQuantity
          );

          const previousStock = batch.currentStock;

          batch.currentStock =
            batch.currentStock - quantityFromBatch;

          await batch.save();

          const movement = await StockMovement.create({
            medicine: item.medicine,
            batch: batch._id,
            type: "OUT",
            quantity: quantityFromBatch,
            reason: "Sale",
            reference: finalBillNumber,
            note: `FEFO stock OUT from batch ${batch.batchNumber}`,
            movementDate: saleDate
              ? new Date(saleDate)
              : new Date(),
          });

          stockChanges.push({
            batchId: String(batch._id),
            previousStock,
            quantity: quantityFromBatch,
            medicineId: String(item.medicine),
            movementId: String(movement._id),
          });

          // First batch information is stored in sale item
          if (!item.batch) {
            item.batch = batch._id;
            item.batchNumber = batch.batchNumber;
          }

          remainingQuantity -= quantityFromBatch;
        }
      }
    }

    // -----------------------------
    // Customer snapshot
    // -----------------------------

    const finalCustomerName =
      selectedCustomer?.customerName ||
      customerName?.trim() ||
      undefined;

    const finalCustomerPhone =
      selectedCustomer?.phone ||
      customerPhone?.trim() ||
      undefined;

    // -----------------------------
    // Create sale
    // -----------------------------

    const sale = await Sale.create({
      billNumber: finalBillNumber,

      customer: selectedCustomer?._id || undefined,

      customerName: finalCustomerName,

      customerPhone: finalCustomerPhone,

      items: preparedItems,

      subtotal: Number(subtotal),

      discount: Number(discount || 0),

      tax: Number(tax || 0),

      grandTotal: Number(grandTotal),

      paymentMethod: paymentMethod || "CASH",

      paymentStatus: paymentStatus || "PAID",

      status: status || "DRAFT",

      saleDate: saleDate
        ? new Date(saleDate)
        : new Date(),

      note: note?.trim() || undefined,
    });

    return NextResponse.json(
      {
        success: true,

        message:
          (status || "DRAFT") === "COMPLETED"
            ? "Sale completed and stock updated successfully"
            : "Sale created successfully",

        sale,

        stockUpdated:
          (status || "DRAFT") === "COMPLETED",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/sales error:",
      error
    );

    // -----------------------------
    // Rollback stock if sale failed
    // -----------------------------

    if (stockChanges.length > 0) {
      try {
        for (const change of stockChanges) {
          await MedicineBatch.findByIdAndUpdate(
            change.batchId,
            {
              $inc: {
                currentStock: change.quantity,
              },
            }
          );

          if (change.movementId) {
            await StockMovement.findByIdAndDelete(
              change.movementId
            );
          }
        }

        console.log(
          "Stock rollback completed after sale failure"
        );
      } catch (rollbackError) {
        console.error(
          "Stock rollback failed:",
          rollbackError
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create sale";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

