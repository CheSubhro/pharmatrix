

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Customer from "@/models/Customer";

// GET - Get all active customers
export async function GET() {
  try {
    await connectDB();

    const customers = await Customer.find({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        customers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/customers error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}

// POST - Create customer
export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      customerName,
      phone,
      email,
      address,
      dateOfBirth,
      gender,
      notes,
    } = body;

    // Required field validation
    if (
      !customerName ||
      typeof customerName !== "string" ||
      !customerName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        { status: 400 }
      );
    }

    if (
      !phone ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number is required",
        },
        { status: 400 }
      );
    }

    const cleanName = customerName.trim();
    const cleanPhone = phone.trim();

    // Check duplicate active customer by phone
    const existingCustomer =
      await Customer.findOne({
        phone: cleanPhone,
        isActive: true,
      });

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A customer with this phone number already exists",
        },
        { status: 409 }
      );
    }

    // Validate gender
    const allowedGenders = [
      "MALE",
      "FEMALE",
      "OTHER",
    ];

    if (
      gender &&
      !allowedGenders.includes(gender)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid gender",
        },
        { status: 400 }
      );
    }

    const customer =
      await Customer.create({
        customerName: cleanName,
        phone: cleanPhone,
        email:
          typeof email === "string" &&
          email.trim()
            ? email.trim()
            : undefined,
        address:
          typeof address === "string" &&
          address.trim()
            ? address.trim()
            : undefined,
        dateOfBirth: dateOfBirth
          ? new Date(dateOfBirth)
          : undefined,
        gender,
        notes:
          typeof notes === "string" &&
          notes.trim()
            ? notes.trim()
            : undefined,
        isActive: true,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/customers error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer",
      },
      { status: 500 }
    );
  }
}

