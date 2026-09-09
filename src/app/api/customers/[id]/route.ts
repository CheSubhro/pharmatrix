

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Customer from "@/models/Customer";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get single customer
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const customer =
      await Customer.findById(id).lean();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        customer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer",
      },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    const {
      customerName,
      phone,
      email,
      address,
      dateOfBirth,
      gender,
      notes,
      isActive,
    } = body;

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

    const cleanPhone = phone.trim();

    // Check duplicate phone
    const existingCustomer =
      await Customer.findOne({
        phone: cleanPhone,
        _id: { $ne: id },
        isActive: true,
      });

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another customer already uses this phone number",
        },
        { status: 409 }
      );
    }

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
      await Customer.findByIdAndUpdate(
        id,
        {
          customerName: customerName.trim(),
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
          ...(typeof isActive === "boolean"
            ? { isActive }
            : {}),
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer updated successfully",
        customer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUT /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer",
      },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate customer
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const customer =
      await Customer.findByIdAndUpdate(
        id,
        {
          isActive: false,
        },
        {
          new: true,
        }
      ).lean();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer deactivated successfully",
        customer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to deactivate customer",
      },
      { status: 500 }
    );
  }
}

