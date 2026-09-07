

import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import Rack from "@/models/Rack";

export async function GET() {
  try {
    await connectDB();

    const racks = await Rack.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      racks,
    });
  } catch (error) {
    console.error("Get racks error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch racks",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const name = body.name?.trim();
    const code = body.code?.trim();
    const description = body.description?.trim();

    const shelves = Array.isArray(body.shelves)
      ? body.shelves
          .map((shelf: unknown) =>
            typeof shelf === "string" ? shelf.trim() : ""
          )
          .filter(Boolean)
      : [];

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Rack name is required",
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Rack code is required",
        },
        { status: 400 }
      );
    }

    const existingRack = await Rack.findOne({
      $or: [
        { name: { $regex: `^${name}$`, $options: "i" } },
        { code: { $regex: `^${code}$`, $options: "i" } },
      ],
    });

    if (existingRack) {
      return NextResponse.json(
        {
          success: false,
          message: "Rack name or code already exists",
        },
        { status: 409 }
      );
    }

    const rack = await Rack.create({
      name,
      code,
      shelves,
      description,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Rack created successfully",
        rack,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create rack error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create rack",
      },
      { status: 500 }
    );
  }
}

