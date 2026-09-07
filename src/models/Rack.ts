

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRack extends Document {
  name: string;
  code: string;
  shelves: string[];
  description?: string;
  isActive: boolean;
}

const RackSchema = new Schema<IRack>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    shelves: {
      type: [String],
      default: [],
    },

    description: {
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

const Rack: Model<IRack> =
  mongoose.models.Rack ||
  mongoose.model<IRack>("Rack", RackSchema);

export default Rack;

