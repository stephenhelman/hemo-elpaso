import { NextResponse } from "next/server";
import { getAdminWithPermissions } from "@/lib/permissions";

export async function GET() {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    return NextResponse.json(
      { permissions: [], isSuperAdmin: false },
      { status: 200 },
    );
  }

  return NextResponse.json({
    permissions: Array.from(admin.permissions),
    isSuperAdmin: admin.isSuperAdmin,
  });
}
