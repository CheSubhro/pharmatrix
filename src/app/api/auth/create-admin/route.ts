
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/services/auth.service";

export async function POST() {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      email: "admin@medicalshop.com",
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin user already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword("Admin@123456");

    const admin = await User.create({
      name: "Super Admin",
      email: "admin@medicalshop.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Super Admin created successfully",
      userId: admin._id,
    });
  } catch (error) {
    console.error("Create Admin Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create admin",
      },
      { status: 500 }
    );
  }
}