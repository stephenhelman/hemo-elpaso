import { NextResponse } from "next/server";
import { translateBilingual, getUsageStats } from "@/lib/translate";

export async function GET() {
  try {
    // Test translation
    const result = await translateBilingual(
      "Hello, this is a test of the DeepL translation system.",
    );

    // Get usage stats
    const usage = await getUsageStats();

    return NextResponse.json({
      success: true,
      translation: result,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.limit - usage.used,
        percentUsed: ((usage.used / usage.limit) * 100).toFixed(2) + "%",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
