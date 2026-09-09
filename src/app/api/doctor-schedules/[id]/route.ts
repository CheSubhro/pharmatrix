

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import {connectDB} from "@/lib/mongodb";
import DoctorSchedule from "@/models/DoctorSchedule";
import Doctor from "@/models/Doctor";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function isOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return startA < endB && endA > startB;
}

// GET single schedule
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid schedule ID",
        },
        { status: 400 }
      );
    }

    const schedule = await DoctorSchedule.findById(id)
      .populate(
        "doctor",
        "doctorName specialization chamber"
      )
      .lean();

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        schedule,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/doctor-schedules/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch schedule",
      },
      { status: 500 }
    );
  }
}

// PUT update schedule
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid schedule ID",
        },
        { status: 400 }
      );
    }

    const existingSchedule =
      await DoctorSchedule.findById(id);

    if (!existingSchedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found",
        },
        { status: 404 }
      );
    }

    const doctor = await Doctor.findOne({
      _id: existingSchedule.doctor,
      isActive: true,
    }).lean();

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          message: "Active doctor not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
      dayOfWeek,
      startTime,
      endTime,
      chamber,
      notes,
      isActive,
    } = body;

    if (!dayOfWeek || !DAYS.includes(dayOfWeek)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid day of week",
        },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Start time and end time are required",
        },
        { status: 400 }
      );
    }

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Time must be in HH:mm format",
        },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          success: false,
          message:
            "End time must be later than start time",
        },
        { status: 400 }
      );
    }

    const normalizedChamber =
      typeof chamber === "string"
        ? chamber.trim()
        : "";

    // Get other active schedules for the selected day
    const existingSchedules =
      await DoctorSchedule.find({
        _id: { $ne: id },
        dayOfWeek,
        isActive: true,
      }).lean();

    // ----------------------------------------
    // 1. Same doctor conflict
    // ----------------------------------------

    const doctorConflict =
      existingSchedules.find((schedule) => {
        return (
          schedule.doctor.toString() ===
            existingSchedule.doctor.toString() &&
          isOverlapping(
            schedule.startTime,
            schedule.endTime,
            startTime,
            endTime
          )
        );
      });

    if (doctorConflict) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This doctor already has another visiting schedule during this time.",
          conflictType: "DOCTOR",
          conflictScheduleId:
            doctorConflict._id,
        },
        { status: 409 }
      );
    }

    // ----------------------------------------
    // 2. Same chamber conflict
    // ----------------------------------------

    if (normalizedChamber) {
      const chamberConflict =
        existingSchedules.find((schedule) => {
          const existingChamber =
            schedule.chamber
              ?.trim()
              .toLowerCase();

          return (
            existingChamber &&
            existingChamber ===
              normalizedChamber.toLowerCase() &&
            isOverlapping(
              schedule.startTime,
              schedule.endTime,
              startTime,
              endTime
            )
          );
        });

      if (chamberConflict) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This chamber is already occupied during this time.",
            conflictType: "CHAMBER",
            conflictScheduleId:
              chamberConflict._id,
          },
          { status: 409 }
        );
      }
    }

    existingSchedule.dayOfWeek =
      dayOfWeek;

    existingSchedule.startTime =
      startTime;

    existingSchedule.endTime =
      endTime;

    existingSchedule.chamber =
      normalizedChamber || undefined;

    existingSchedule.notes =
      typeof notes === "string"
        ? notes.trim() || undefined
        : undefined;

    if (typeof isActive === "boolean") {
      existingSchedule.isActive =
        isActive;
    }

    await existingSchedule.save();

    const updatedSchedule =
      await DoctorSchedule.findById(id)
        .populate(
          "doctor",
          "doctorName specialization chamber"
        )
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          "Doctor schedule updated successfully",
        schedule: updatedSchedule,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUT /api/doctor-schedules/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update doctor schedule",
      },
      { status: 500 }
    );
  }
}

// DELETE = deactivate schedule
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid schedule ID",
        },
        { status: 400 }
      );
    }

    const schedule =
      await DoctorSchedule.findById(id);

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found",
        },
        { status: 404 }
      );
    }

    schedule.isActive = false;

    await schedule.save();

    return NextResponse.json(
      {
        success: true,
        message:
          "Doctor schedule deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/doctor-schedules/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to deactivate doctor schedule",
      },
      { status: 500 }
    );
  }
}

