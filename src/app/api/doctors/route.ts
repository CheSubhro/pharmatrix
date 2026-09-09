

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Doctor from "@/models/Doctor";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const doctors = await Doctor.find({
      isActive: true,
    })
      .sort({ doctorName: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        doctors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/doctors error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch doctors",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    const doctor = await Doctor.create({
      doctorName: doctorName.trim(),
      specialization: specialization?.trim() || undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim() || undefined,
      qualification: qualification?.trim() || undefined,
      registrationNumber:
        registrationNumber?.trim() || undefined,
      consultationFee: finalConsultationFee,
      chamber: chamber?.trim() || undefined,
      notes: notes?.trim() || undefined,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Doctor created successfully",
        doctor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/doctors error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create doctor",
      },
      { status: 500 }
    );
  }
}

