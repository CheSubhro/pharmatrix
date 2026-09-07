

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedicineBatch extends Document {
  medicine: mongoose.Types.ObjectId;
  batchNumber: string;
  manufacturingDate?: Date;
  expiryDate: Date;
  initialStock: number;
  currentStock: number;
  isActive: boolean;
}

const MedicineBatchSchema = new Schema<IMedicineBatch>(
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

    initialStock: {
      type: Number,
      required: true,
      min: 0,
    },

    currentStock: {
      type: Number,
      required: true,
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

const MedicineBatch: Model<IMedicineBatch> =
  mongoose.models.MedicineBatch ||
  mongoose.model<IMedicineBatch>("MedicineBatch", MedicineBatchSchema);

export default MedicineBatch;

