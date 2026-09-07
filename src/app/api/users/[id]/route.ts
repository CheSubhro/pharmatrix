
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/constants/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(
      PERMISSIONS.USER_VIEW
    );

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Authentication required"
              : "You do not have permission to view users",
        },
        { status: auth.status }
      );
    }

    const { id } = await params;

    await connectDB();

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

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

    const { name, email, role, isActive } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email and role are required",
        },
        { status: 400 }
      );
    }

    const validRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "PHARMACIST",
      "BILLING_STAFF",
      "RECEPTIONIST",
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user role",
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

    const normalizedEmail = String(email)
      .toLowerCase()
      .trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Another user already uses this email",
        },
        { status: 409 }
      );
    }

    user.name = String(name).trim();
    user.email = normalizedEmail;
    user.role = role;
    user.isActive = Boolean(isActive);

    await user.save();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user",
      },
      { status: 500 }
    );
  }
}