

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier extends Document {
  supplierName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
  paymentTerms?: string;
  isActive: boolean;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    contactPerson: {
      type: String,
      trim: true,
    },

    paymentTerms: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>("Supplier", SupplierSchema);

export default Supplier;

