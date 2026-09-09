

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctorSchedule extends Document {
  doctor: mongoose.Types.ObjectId;

  dayOfWeek:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

  startTime: string;
  endTime: string;

  chamber?: string;

  isActive: boolean;

  notes?: string;
}

const DoctorScheduleSchema =
  new Schema<IDoctorSchedule>(
    {
      doctor: {
        type: Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
        index: true,
      },

      dayOfWeek: {
        type: String,
        required: true,
        enum: [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ],
        index: true,
      },

      startTime: {
        type: String,
        required: true,
        trim: true,
      },

      endTime: {
        type: String,
        required: true,
        trim: true,
      },

      chamber: {
        type: String,
        trim: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      notes: {
        type: String,
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

DoctorScheduleSchema.index({
  doctor: 1,
  dayOfWeek: 1,
  startTime: 1,
});

DoctorScheduleSchema.index({
  dayOfWeek: 1,
  chamber: 1,
  startTime: 1,
});

const DoctorSchedule: Model<IDoctorSchedule> =
  mongoose.models.DoctorSchedule ||
  mongoose.model<IDoctorSchedule>(
    "DoctorSchedule",
    DoctorScheduleSchema
  );

export default DoctorSchedule;

