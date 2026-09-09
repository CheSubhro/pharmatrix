

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE" | "OTHER";
  notes?: string;
  isActive: boolean;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
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

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
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

CustomerSchema.index({
  customerName: 1,
});

CustomerSchema.index({
  phone: 1,
});

CustomerSchema.index({
  isActive: 1,
});

const Customer: Model<ICustomer> =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;

