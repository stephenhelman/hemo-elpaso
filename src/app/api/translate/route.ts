import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { translateBilingual } from "@/lib/translate";

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePermission("canViewAdminDashboard");
    if (error) return error;

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text too long (max 5000 characters)" },
        { status: 400 },
      );
    }

    const result = await translateBilingual(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
