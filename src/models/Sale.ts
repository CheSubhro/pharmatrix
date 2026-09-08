

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISaleItem {
  medicine: mongoose.Types.ObjectId;
  medicineName: string;
  genericName?: string;
  batch?: mongoose.Types.ObjectId;
  batchNumber?: string;
  quantity: number;
  sellingPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

export interface ISale extends Document {
  billNumber: string;

  customerName?: string;
  customerPhone?: string;

  items: ISaleItem[];

  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;

  paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";

  status: "DRAFT" | "COMPLETED" | "CANCELLED";

  saleDate: Date;

  note?: string;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    medicineName: {
      type: String,
      required: true,
      trim: true,
    },

    genericName: {
      type: String,
      trim: true,
    },

    batch: {
      type: Schema.Types.ObjectId,
      ref: "MedicineBatch",
    },

    batchNumber: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    taxRate: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const SaleSchema = new Schema<ISale>(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customerName: {
      type: String,
      trim: true,
    },

    customerPhone: {
      type: String,
      trim: true,
    },

    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: "At least one medicine is required",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CARD", "CREDIT"],
      required: true,
      default: "CASH",
    },

    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "PARTIAL"],
      required: true,
      default: "PAID",
    },

    status: {
      type: String,
      enum: ["DRAFT", "COMPLETED", "CANCELLED"],
      required: true,
      default: "DRAFT",
    },

    saleDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

SaleSchema.index({
  billNumber: 1,
});

SaleSchema.index({
  saleDate: -1,
});

SaleSchema.index({
  status: 1,
});

const Sale: Model<ISale> =
  mongoose.models.Sale ||
  mongoose.model<ISale>("Sale", SaleSchema);

export default Sale;

