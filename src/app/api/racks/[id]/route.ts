

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import {connectDB} from "@/lib/mongodb";
import Rack from "@/models/Rack";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET — Get single rack
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid rack ID",
        },
        { status: 400 }
      );
    }

    const rack = await Rack.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!rack) {
      return NextResponse.json(
        {
          success: false,
          message: "Rack not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rack,
    });
  } catch (error) {
    console.error("Get rack error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch rack",
      },
      { status: 500 }
    );
  }
}

// PUT — Update rack
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid rack ID",
        },
        { status: 400 }
      );
    }

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
      _id: { $ne: id },
      isActive: true,
      $or: [
        {
          name: {
            $regex: `^${name}$`,
            $options: "i",
          },
        },
        {
          code: {
            $regex: `^${code}$`,
            $options: "i",
          },
        },
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

    const rack = await Rack.findOneAndUpdate(
      {
        _id: id,
        isActive: true,
      },
      {
        name,
        code,
        shelves,
        description,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!rack) {
      return NextResponse.json(
        {
          success: false,
          message: "Rack not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Rack updated successfully",
      rack,
    });
  } catch (error) {
    console.error("Update rack error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update rack",
      },
      { status: 500 }
    );
  }
}

// DELETE — Soft delete rack
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid rack ID",
        },
        { status: 400 }
      );
    }

    const rack = await Rack.findOneAndUpdate(
      {
        _id: id,
        isActive: true,
      },
      {
        isActive: false,
      },
      {
        new: true,
      }
    );

    if (!rack) {
      return NextResponse.json(
        {
          success: false,
          message: "Rack not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Rack deleted successfully",
    });
  } catch (error) {
    console.error("Delete rack error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete rack",
      },
      { status: 500 }
    );
  }
}

