

import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Prescription from "@/models/Prescription";
import cloudinary from "@/lib/cloudinary";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET - Customer's prescriptions
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const customer = await Customer.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    const prescriptions = await Prescription.find({
      customer: id,
      isActive: true,
    })
      .sort({ prescriptionDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        prescriptions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/customers/[id]/prescriptions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch prescriptions",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete prescription
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const prescriptionId = request.nextUrl.searchParams.get(
      "prescriptionId"
    );

    if (!prescriptionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Prescription ID is required",
        },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      customer: id,
      isActive: true,
    });

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          message: "Prescription not found",
        },
        { status: 404 }
      );
    }

    // Delete file from Cloudinary if available
    if (prescription.filePublicId) {
      try {
        await cloudinary.uploader.destroy(
          prescription.filePublicId,
          {
            resource_type:
              prescription.fileType === "PDF"
                ? "raw"
                : "image",
          }
        );
      } catch (cloudinaryError) {
        console.error(
          "Cloudinary delete error:",
          cloudinaryError
        );
      }
    }

    // Delete prescription from database
    await Prescription.findByIdAndDelete(
      prescriptionId
    );

    return NextResponse.json(
      {
        success: true,
        message: "Prescription deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/customers/[id]/prescriptions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete prescription",
      },
      { status: 500 }
    );
  }
}

// POST - Add prescription
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const customer = await Customer.findOne({
      _id: id,
      isActive: true,
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const doctorName = String(
      formData.get("doctorName") || ""
    ).trim();

    const prescriptionDate = String(
      formData.get("prescriptionDate") || ""
    ).trim();

    const notes = String(
      formData.get("notes") || ""
    ).trim();

    const file = formData.get("file");

    if (!doctorName) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor name is required",
        },
        { status: 400 }
      );
    }

    if (!prescriptionDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Prescription date is required",
        },
        { status: 400 }
      );
    }

    let fileUrl: string | undefined;
    let filePublicId: string | undefined;
    let fileType: "IMAGE" | "PDF" | undefined;

    // Cloudinary upload
    if (file instanceof File && file.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only JPG, PNG, WEBP images and PDF files are allowed",
          },
          { status: 400 }
        );
      }

      // 10 MB limit
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: "File size must be 10 MB or less",
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<any>(
        (resolve, reject) => {
          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                folder: "pharmatrix/prescriptions",
                resource_type: "auto",
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

          uploadStream.end(buffer);
        }
      );

      fileUrl = uploadResult.secure_url;
      filePublicId = uploadResult.public_id;

      fileType = file.type === "application/pdf"
        ? "PDF"
        : "IMAGE";
    }

    const prescription = await Prescription.create({
      customer: customer._id,
      doctorName,
      prescriptionDate: new Date(prescriptionDate),
      fileUrl,
      filePublicId,
      fileType,
      notes: notes || undefined,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Prescription added successfully",
        prescription,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/customers/[id]/prescriptions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add prescription",
      },
      { status: 500 }
    );
  }
}

