

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStockMovement extends Document {
  medicine: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  type: "IN" | "OUT";
  quantity: number;
  reason?: string;
  reference?: string;
  note?: string;
  movementDate: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    batch: {
      type: Schema.Types.ObjectId,
      ref: "MedicineBatch",
      required: true,
    },

    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      trim: true,
    },

    reference: {
      type: String,
      trim: true,
    },

    note: {
      type: String,
      trim: true,
    },

    movementDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

StockMovementSchema.index({
  medicine: 1,
  batch: 1,
  movementDate: -1,
});

const StockMovement: Model<IStockMovement> =
  mongoose.models.StockMovement ||
  mongoose.model<IStockMovement>(
    "StockMovement",
    StockMovementSchema
  );

export default StockMovement;
