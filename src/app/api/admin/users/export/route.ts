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

    // Parse filter params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "";
    const condition = searchParams.get("condition") ?? "";

    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (condition) {
      where.profile = { primaryCondition: condition };
    }

    // Get users with profiles, applying server-side filters
    let users = await prisma.patient.findMany({
      where,
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Apply search filter (name or email)
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => {
        const name = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.toLowerCase();
        return name.includes(q) || u.email.toLowerCase().includes(q);
      });
    }

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
        details: `Exported ${users.length} users to CSV${search ? ` (search: ${search})` : ""}${role ? ` (role: ${role})` : ""}${condition ? ` (condition: ${condition})` : ""}`,
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
