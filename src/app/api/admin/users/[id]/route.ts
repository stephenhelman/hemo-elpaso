import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageUsers");
    if (error) return error;

    const body = await request.json();
    const { role, firstName, lastName, phone, city, state, zipCode } = body;

    // Validate role
    if (!["patient", "admin", "board"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Find user
    const user = await prisma.patient.findUnique({
      where: { id: params.id },
      include: { contactProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user role
    await prisma.patient.update({
      where: { id: params.id },
      data: {
        role,
      },
    });

    // Update contact profile if exists
    if (user.contactProfile) {
      await prisma.contactProfile.update({
        where: { patientId: params.id },
        data: {
          firstName,
          lastName,
          phone: phone || user.contactProfile.phone,
          city: city || user.contactProfile.city,
          state: state || user.contactProfile.state,
          zipCode: zipCode || user.contactProfile.zipCode,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.USER_UPDATED,
        resourceType: "Patient",
        resourceId: params.id,
        details: `Updated user: ${firstName} ${lastName}, role changed to ${role}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    // Only board members can delete users
    if (!admin || admin.role !== "board") {
      return NextResponse.json(
        { error: "Forbidden - Board access required" },
        { status: 403 },
      );
    }

    // Find user
    const user = await prisma.patient.findUnique({
      where: { id: params.id },
      include: { contactProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if (user.id === admin.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Delete user (cascade will handle profile, RSVPs, check-ins, etc)
    await prisma.patient.delete({
      where: { id: params.id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.USER_DELETED,
        resourceType: "Patient",
        resourceId: params.id,
        details: `Deleted user: ${user.contactProfile?.firstName} ${user.contactProfile?.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
