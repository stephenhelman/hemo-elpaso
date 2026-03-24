import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import { AuditAction } from "@prisma/client";
import { getVolunteerRecipient } from "@/lib/contact-routing";

const FALLBACK_EMAIL = "info@hemo-el-paso.org";

const INQUIRY_ONLY_AREAS = ["board_membership", "professional_skills"];

function isInquiryOnly(areasOfInterest: string[]): boolean {
  return areasOfInterest.some((a) => INQUIRY_ONLY_AREAS.includes(a));
}

function getSubjectPrefix(areasOfInterest: string[]): string {
  if (areasOfInterest.includes("board_membership")) return "[Board Interest] ";
  if (areasOfInterest.includes("professional_skills")) return "[Pro Bono Inquiry] ";
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      areasOfInterest = [],
      whyVolunteer,
      availability,
      skills,
      hasBDConnection = false,
    } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    const toEmail = await getVolunteerRecipient(areasOfInterest);
    const subjectPrefix = getSubjectPrefix(areasOfInterest);
    const inquiryOnly = isInquiryOnly(areasOfInterest);

    let volunteerProfileId: string | null = null;

    // ── Create VolunteerProfile for non-inquiry-only submissions ──────────────
    if (!inquiryOnly) {
      const profile = await prisma.volunteerProfile.create({
        data: {
          patientId: null,
          status: "PENDING_REVIEW",
          contactName: name.trim(),
          contactEmail: email.trim(),
          contactPhone: phone?.trim() || null,
          areasOfInterest,
          whyVolunteer: whyVolunteer?.trim() || null,
          generalAvailability: availability ? { note: availability } : undefined,
          skills: skills ? { note: skills } : undefined,
          hasBDConnection,
        },
      });
      volunteerProfileId = profile.id;

      await prisma.auditLog.create({
        data: {
          action: AuditAction.VOLUNTEER_REQUEST_SUBMITTED,
          resourceType: "VolunteerProfile",
          resourceId: profile.id,
          details: `Community volunteer inquiry from ${email}`,
        },
      });
    }

    // ── Notification to board ─────────────────────────────────────────────────
    const areaLabels = areasOfInterest.join(", ") || "Not specified";
    try {
      await resend.emails.send({
        from: `HOEP Volunteer Form <noreply@hemo-el-paso.org>`,
        to: toEmail,
        replyTo: email,
        subject: `${subjectPrefix}New Volunteer Inquiry — ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#8B1538">New Volunteer Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
            <p><strong>Areas of Interest:</strong> ${areaLabels}</p>
            ${availability ? `<p><strong>Availability:</strong> ${availability}</p>` : ""}
            ${whyVolunteer ? `<p><strong>Why they want to volunteer:</strong><br/>${whyVolunteer}</p>` : ""}
            ${skills ? `<p><strong>Skills:</strong><br/>${skills}</p>` : ""}
            ${hasBDConnection ? `<p><strong>Has BD connection:</strong> Yes</p>` : ""}
            ${volunteerProfileId ? `<p><em>VolunteerProfile ID: ${volunteerProfileId}</em></p>` : "<p><em>Inquiry only — no volunteer profile created.</em></p>"}
            <hr style="border-color:#e5e7eb;margin:24px 0"/>
            <p style="color:#6b7280;font-size:13px">Hemophilia Outreach of El Paso</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send volunteer notification:", emailError);
    }

    // ── Confirmation to submitter ─────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: `HOEP <${FALLBACK_EMAIL}>`,
        to: email,
        subject: "We received your volunteer inquiry — HOEP",
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2 style="color:#8B1538">Thank you, ${name}!</h2>
            <p>We received your volunteer inquiry and will be in touch within a few business days.</p>
            <hr style="border-color:#e5e7eb;margin:24px 0"/>
            <p style="color:#6b7280;font-size:13px">Hemophilia Outreach of El Paso<br/>info@hemo-el-paso.org</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send volunteer confirmation:", emailError);
    }

    return NextResponse.json({ success: true, volunteerProfileId });
  } catch (error) {
    console.error("Volunteer inquiry error:", error);
    return NextResponse.json(
      { error: "Failed to submit volunteer inquiry. Please try again." },
      { status: 500 },
    );
  }
}
