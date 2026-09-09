

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrescription extends Document {
  customer: mongoose.Types.ObjectId;

  doctorName: string;
  prescriptionDate: Date;

  fileUrl?: string;
  filePublicId?: string;
  fileType?: "IMAGE" | "PDF";

  notes?: string;

  isActive: boolean;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    doctorName: {
      type: String,
      required: true,
      trim: true,
    },

    prescriptionDate: {
      type: Date,
      required: true,
    },

    fileUrl: {
      type: String,
      trim: true,
    },

    filePublicId: {
      type: String,
      trim: true,
    },

    fileType: {
      type: String,
      enum: ["IMAGE", "PDF"],
    },

    notes: {
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

PrescriptionSchema.index({
  customer: 1,
  prescriptionDate: -1,
});

const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>(
    "Prescription",
    PrescriptionSchema
  );

export default Prescription;

