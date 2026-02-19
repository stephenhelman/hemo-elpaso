import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, eventId, sponsorEmail, sponsorName, companyName } = body;

    // Verify token
    const tokenData = await prisma.sponsorAccessToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (new Date() > tokenData.expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    if (tokenData.eventId !== eventId) {
      return NextResponse.json({ error: "Token mismatch" }, { status: 401 });
    }

    // Create or get a "sponsor" patient account
    let sponsorPatient = await prisma.patient.findUnique({
      where: { email: sponsorEmail },
    });

    if (!sponsorPatient) {
      // Create sponsor as a patient with sponsor role
      sponsorPatient = await prisma.patient.create({
        data: {
          auth0Id: `sponsor_${crypto.randomBytes(16).toString("hex")}`,
          email: sponsorEmail,
          role: "patient", // Base role
          profile: {
            create: {
              firstName: sponsorName || "Sponsor",
              lastName: companyName || "",
              phone: "",
              dateOfBirth: new Date(),
              address: "",
              city: "",
              state: "",
              zipCode: "",
              primaryCondition: "N/A",
              severity: "N/A",
              diagnosisDate: new Date(),
              emergencyContactName: "",
              emergencyContactRelationship: "",
              emergencyContactPhone: "",
              hipaaConsent: false,
              photoConsent: false,
              communicationConsent: false,
            },
          },
        },
      });
    }

    // Check if already checked in
    let checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId,
        patientId: sponsorPatient.id,
      },
    });

    if (!checkIn) {
      // Create check-in with sponsor role
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      checkIn = await prisma.checkIn.create({
        data: {
          eventId,
          patientId: sponsorPatient.id,
          sessionToken,
          attendeeRole: "sponsor",
          sessionExpiresAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionToken: checkIn.sessionToken,
    });
  } catch (error) {
    console.error("Sponsor check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
