import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check if patient already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: "Patient profile already exists" },
        { status: 409 },
      );
    }

    // Create patient with profile, preferences, and family members in transaction
    const patient = await prisma.patient.create({
      data: {
        auth0Id: session.user.sub,
        email: session.user.email!,
        role: "patient",
        preferredLanguage: body.languagePreference || "en",

        // Create profile
        profile: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            dateOfBirth: new Date(body.dateOfBirth),
            phone: body.phone,
            address: body.address,
            city: body.city,
            state: body.state,
            zipCode: body.zipCode,

            primaryCondition: body.primaryCondition,
            severity: body.severity,
            diagnosisDate: new Date(body.diagnosisDate),
            treatingPhysician: body.treatingPhysician || null,
            specialtyPharmacy: body.specialtyPharmacy || null,

            emergencyContactName: body.emergencyName,
            emergencyContactRelationship: body.emergencyRelationship,
            emergencyContactPhone: body.emergencyPhone,

            hipaaConsent: body.hipaaConsent,
            photoConsent: body.photoConsent,
            communicationConsent: body.communicationConsent,
          },
        },

        // Create preferences
        preferences: {
          create: {
            interestedTopics: body.interestedTopics || [],
            preferredEventTimes: body.preferredEventTimes || [],
            maxTravelDistance: body.maxTravelDistance || 30,
            dietaryRestrictions: body.dietaryRestrictions || ["NONE"],
            accessibilityNeeds: body.accessibilityNeeds || null,
            emailNotifications: body.emailNotifications ?? true,
            smsNotifications: body.smsNotifications ?? false,
            languagePreference: body.languagePreference || "en",
          },
        },

        // Create family members
        familyMembers: {
          create: (body.familyMembers || []).map((member: any) => ({
            firstName: member.firstName,
            lastName: member.lastName,
            dateOfBirth: member.dateOfBirth
              ? new Date(member.dateOfBirth)
              : null,
            relationship: member.relationship,
            hasBleedingDisorder: member.hasBleedingDisorder || false,
            condition: member.condition || null,
            severity: member.severity || null,
          })),
        },
      },
      include: {
        profile: true,
        preferences: true,
        familyMembers: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "patient_registration",
        details: `Patient profile created with ${patient.familyMembers.length} family members`,
      },
    });

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        email: patient.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
