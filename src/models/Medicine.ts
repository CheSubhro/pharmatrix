

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedicine extends Document {
  name: string;
  genericName?: string;
  company?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
  rack?: string;
  shelf?: string;
  minimumStock: number;
  sellingPrice: number;
  purchasePrice: number;
  taxRate: number;
  isActive: boolean;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    genericName: {
      type: String,
      trim: true,
    },

    company: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
    },

    strength: {
      type: String,
      trim: true,
    },

    dosageForm: {
      type: String,
      trim: true,
    },

    rack: {
      type: String,
      trim: true,
    },

    shelf: { type: String, trim: true },

    minimumStock: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
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

const Medicine: Model<IMedicine> =
  mongoose.models.Medicine ||
  mongoose.model<IMedicine>("Medicine", MedicineSchema);

export default Medicine;

