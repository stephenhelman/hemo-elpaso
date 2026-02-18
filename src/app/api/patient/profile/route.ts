import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await request.json();

    // Update profile
    const updatedProfile = await prisma.patientProfile.update({
      where: { patientId: patient.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        primaryCondition: body.primaryCondition,
        severity: body.severity,
        diagnosisDate: body.diagnosisDate
          ? new Date(body.diagnosisDate)
          : undefined,
        treatingPhysician: body.treatingPhysician || null,
        specialtyPharmacy: body.specialtyPharmacy || null,
        emergencyContactName: body.emergencyContactName,
        emergencyContactRelationship: body.emergencyContactRelationship,
        emergencyContactPhone: body.emergencyContactPhone,
      },
    });

    // Update preferences if provided
    if (body.preferences) {
      await prisma.patientPreferences.update({
        where: { patientId: patient.id },
        data: {
          interestedTopics: body.preferences.interestedTopics,
          preferredEventTimes: body.preferences.preferredEventTimes,
          maxTravelDistance: body.preferences.maxTravelDistance,
          dietaryRestrictions: body.preferences.dietaryRestrictions,
          accessibilityNeeds: body.preferences.accessibilityNeeds,
          emailNotifications: body.preferences.emailNotifications,
          smsNotifications: body.preferences.smsNotifications,
          languagePreference: body.preferences.languagePreference,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "profile_updated",
        resourceType: "PatientProfile",
        resourceId: updatedProfile.id,
        details: "Profile information updated",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
