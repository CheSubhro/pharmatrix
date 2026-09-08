

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchaseItem {
  medicine: mongoose.Types.ObjectId;
  batchNumber: string;
  manufacturingDate?: Date;
  expiryDate: Date;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export interface IPurchase extends Document {
  purchaseNumber: string;

  // Supplier reference
  supplier?: mongoose.Types.ObjectId;

  // Kept for backward compatibility
  supplierName: string;
  supplierPhone?: string;

  invoiceNumber?: string;
  purchaseDate: Date;
  status: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  note?: string;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },

    manufacturingDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    supplierPhone: {
      type: String,
      trim: true,
    },

    invoiceNumber: {
      type: String,
      trim: true,
    },

    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"],
      default: "DRAFT",
    },

    items: {
      type: [PurchaseItemSchema],
      required: true,
      validate: {
        validator: (items: IPurchaseItem[]) => items.length > 0,
        message: "At least one purchase item is required",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      min: 0,
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

const Purchase: Model<IPurchase> =
  mongoose.models.Purchase ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;

