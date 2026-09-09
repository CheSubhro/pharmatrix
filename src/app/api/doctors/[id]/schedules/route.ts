

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import {connectDB} from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import DoctorSchedule from "@/models/DoctorSchedule";

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
] as const;

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

// GET all schedules for a doctor
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
          message: "Invalid doctor ID",
        },
        { status: 400 }
      );
    }

    const schedules = await DoctorSchedule.find({
      doctor: id,
      isActive: true,
    })
      .populate(
        "doctor",
        "doctorName specialization chamber"
      )
      .lean();

    const dayOrder: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    schedules.sort((a, b) => {
      const dayDifference =
        dayOrder[a.dayOfWeek] -
        dayOrder[b.dayOfWeek];

      if (dayDifference !== 0) {
        return dayDifference;
      }

      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json(
      {
        success: true,
        schedules,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/doctors/[id]/schedules error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch doctor schedules",
      },
      { status: 500 }
    );
  }
}

// POST create a new schedule
export async function POST(
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
          message: "Invalid doctor ID",
        },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findOne({
      _id: id,
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
    } = body;

    // Required validation
    if (!dayOfWeek) {
      return NextResponse.json(
        {
          success: false,
          message: "Day of week is required",
        },
        { status: 400 }
      );
    }

    if (!DAYS.includes(dayOfWeek)) {
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
          message: "Start time and end time are required",
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

    // Get active schedules for this day
    const existingSchedules =
      await DoctorSchedule.find({
        dayOfWeek,
        isActive: true,
      }).lean();

    // ----------------------------------------
    // 1. Same doctor conflict
    // ----------------------------------------

    const doctorConflict =
      existingSchedules.find((schedule) => {
        return (
          schedule.doctor.toString() === id &&
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
            "This doctor already has a visiting schedule during this time.",
          conflictType: "DOCTOR",
          conflictScheduleId: doctorConflict._id,
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
            schedule.chamber?.trim().toLowerCase();

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

    const schedule =
      await DoctorSchedule.create({
        doctor: id,
        dayOfWeek,
        startTime,
        endTime,
        chamber:
          normalizedChamber || undefined,
        notes:
          typeof notes === "string"
            ? notes.trim() || undefined
            : undefined,
        isActive: true,
      });

    const populatedSchedule =
      await DoctorSchedule.findById(
        schedule._id
      )
        .populate(
          "doctor",
          "doctorName specialization chamber"
        )
        .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          "Doctor visiting schedule created successfully",
        schedule: populatedSchedule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/doctors/[id]/schedules error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create doctor schedule",
      },
      { status: 500 }
    );
  }
}

