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

    // Check if patient already exists with this auth0Id
    const existingPatient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: "Patient profile already exists" },
        { status: 409 },
      );
    }

    // Create patient and profile in a transaction
    const patient = await prisma.patient.create({
      data: {
        auth0Id: session.user.sub,
        email: session.user.email!,
        role: "patient",
        profile: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            dateOfBirth: new Date(body.dateOfBirth),
            phone: body.phone,
            /* address: body.address,
            city: body.city,
            state: body.state,
            zipCode: body.zipCode, */

            // Diagnosis info
            primaryCondition: body.primaryCondition,
            severity: body.severity,
            diagnosisDate: new Date(body.diagnosisDate),

            treatingPhysician: body.treatingPhysician || null,
            specialtyPharmacy: body.specialtyPharmacy || null,

            // Emergency contact
            emergencyContactName: body.emergencyName,
            emergencyContactRelationship: body.emergencyRelationship,
            emergencyContactPhone: body.emergencyPhone,

            // Consent
            hipaaConsent: body.hipaaConsent,
            photoConsent: body.photoConsent,
            communicationConsent: body.communicationConsent,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: patient.id,
        action: "patient_registration",
        changes: { message: "Patient profile created" },
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
