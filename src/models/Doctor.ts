

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctor extends Document {
  doctorName: string;
  specialization?: string;
  phone?: string;
  email?: string;
  qualification?: string;
  registrationNumber?: string;
  consultationFee?: number;
  chamber?: string;
  notes?: string;
  isActive: boolean;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },

    specialization: {
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

    qualification: {
      type: String,
      trim: true,
    },

    registrationNumber: {
      type: String,
      trim: true,
    },

    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    chamber: {
      type: String,
      trim: true,
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

DoctorSchema.index({ doctorName: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ phone: 1 });
DoctorSchema.index({ isActive: 1 });

const Doctor: Model<IDoctor> =
  mongoose.models.Doctor ||
  mongoose.model<IDoctor>("Doctor", DoctorSchema);

export default Doctor;

