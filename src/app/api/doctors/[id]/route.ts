

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Doctor from "@/models/Doctor";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const doctor = await Doctor.findById(id).lean();

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        doctor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/doctors/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch doctor",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const body = await request.json();

    const {
      doctorName,
      specialization,
      phone,
      email,
      qualification,
      registrationNumber,
      consultationFee,
      chamber,
      notes,
      isActive,
    } = body;

    if (!doctorName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor name is required",
        },
        { status: 400 }
      );
    }

    const finalConsultationFee = Number(
      consultationFee || 0
    );

    if (
      !Number.isFinite(finalConsultationFee) ||
      finalConsultationFee < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Consultation fee must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      {
        doctorName: doctorName.trim(),
        specialization: specialization?.trim() || undefined,
        phone: phone?.trim() || undefined,
        email: email?.trim() || undefined,
        qualification:
          qualification?.trim() || undefined,
        registrationNumber:
          registrationNumber?.trim() || undefined,
        consultationFee: finalConsultationFee,
        chamber: chamber?.trim() || undefined,
        notes: notes?.trim() || undefined,
        ...(typeof isActive === "boolean"
          ? { isActive }
          : {}),
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Doctor updated successfully",
        doctor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/doctors/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update doctor",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      {
        isActive: false,
      },
      {
        new: true,
      }
    ).lean();

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Doctor deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/doctors/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to deactivate doctor",
      },
      { status: 500 }
    );
  }
}

