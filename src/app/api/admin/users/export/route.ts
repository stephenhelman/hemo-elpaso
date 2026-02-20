import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users with profiles
    const users = await prisma.patient.findMany({
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Create CSV content
    const headers = [
      "ID",
      "Email",
      "First Name",
      "Last Name",
      "Phone",
      "Date of Birth",
      "City",
      "State",
      "ZIP",
      "Primary Condition",
      "Severity",
      "Role",
      "Diagnosis Verified",
      "Registration Date",
      "Preferred Language",
    ];

    const rows = users.map((user) => [
      user.id,
      user.email,
      user.profile?.firstName || "",
      user.profile?.lastName || "",
      user.profile?.phone || "",
      user.profile?.dateOfBirth
        ? new Date(user.profile.dateOfBirth).toLocaleDateString()
        : "",
      user.profile?.city || "",
      user.profile?.state || "",
      user.profile?.zipCode || "",
      user.profile?.primaryCondition || "",
      user.profile?.severity || "",
      user.role,
      user.diagnosisVerified ? "Yes" : "No",
      new Date(user.createdAt).toLocaleDateString(),
      user.profile?.preferredLanguage || "en",
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape cells that contain commas or quotes
            const stringCell = String(cell);
            if (
              stringCell.includes(",") ||
              stringCell.includes('"') ||
              stringCell.includes("\n")
            ) {
              return `"${stringCell.replace(/"/g, '""')}"`;
            }
            return stringCell;
          })
          .join(","),
      ),
    ].join("\n");

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "users_exported",
        resourceType: "Patient",
        details: `Exported ${users.length} users to CSV`,
      },
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hoep-users-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("User export error:", error);
    return NextResponse.json(
      { error: "Failed to export users" },
      { status: 500 },
    );
  }
}
