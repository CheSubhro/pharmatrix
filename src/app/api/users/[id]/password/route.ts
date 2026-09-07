

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/constants/permissions";
import { hashPassword } from "@/services/auth.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(
      PERMISSIONS.USER_MANAGE
    );

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Authentication required"
              : "You do not have permission to manage users",
        },
        { status: auth.status }
      );
    }

    const { id } = await params;

    const body = await request.json();

    const { password } = body;

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "New password is required",
        },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const hashedPassword = await hashPassword(
      String(password)
    );

    user.password = hashedPassword;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to change password",
      },
      { status: 500 }
    );
  }
}
