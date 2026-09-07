
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/services/auth.service";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/constants/permissions";

export async function POST(request: Request) {
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

    const body = await request.json();

    const {
      name,
      email,
      password,
      role,
      isActive = true,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email, password and role are required",
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

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = String(email)
      .toLowerCase()
      .trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isActive: Boolean(isActive),
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create User Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    await connectDB();

    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}