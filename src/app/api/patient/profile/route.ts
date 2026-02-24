import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

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

    // Update ContactProfile (name, address, phone, DOB)
    const updatedContactProfile = await prisma.contactProfile.update({
      where: { patientId: patient.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        addressLine1: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
      },
    });

    // Upsert DisorderProfile (condition/diagnosis — patient may not have one)
    if (body.primaryCondition) {
      await prisma.disorderProfile.upsert({
        where: { patientId: patient.id },
        create: {
          patientId: patient.id,
          condition: body.primaryCondition,
          severity: body.severity || "",
          dateOfDiagnosis: body.diagnosisDate
            ? new Date(body.diagnosisDate)
            : null,
          treatingPhysician: body.treatingPhysician || null,
          specialtyPharmacy: body.specialtyPharmacy || null,
        },
        update: {
          condition: body.primaryCondition,
          severity: body.severity,
          dateOfDiagnosis: body.diagnosisDate
            ? new Date(body.diagnosisDate)
            : undefined,
          treatingPhysician: body.treatingPhysician || null,
          specialtyPharmacy: body.specialtyPharmacy || null,
        },
      });
    }

    // Update emergency contact on Patient root
    if (
      body.emergencyContactName !== undefined ||
      body.emergencyContactPhone !== undefined ||
      body.emergencyContactRelationship !== undefined
    ) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          emergencyContactName: body.emergencyContactName,
          emergencyContactRelationship: body.emergencyContactRelationship,
          emergencyContactPhone: body.emergencyContactPhone,
        },
      });
    }

    // Update preferences if provided (languagePreference field removed from schema)
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
        },
      });
    }

    // Update preferred language on Patient record + sync locale cookie
    if (body.preferredLanguage) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { preferredLanguage: body.preferredLanguage },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.PROFILE_UPDATED as any,
        resourceType: "ContactProfile",
        resourceId: updatedContactProfile.id,
        details: "Profile information updated",
      },
    });

    const response = NextResponse.json({ success: true });

    // Sync locale cookie if language preference changed
    if (body.preferredLanguage) {
      response.cookies.set("locale", body.preferredLanguage, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
