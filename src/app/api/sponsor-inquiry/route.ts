import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { AuditAction, SponsorStatus } from "@prisma/client";

const FALLBACK_EMAIL = "info@hemo-el-paso.org";

async function getTreasurerEmail(): Promise<string> {
  const role = await prisma.boardRole.findFirst({
    where: { role: "TREASURER", active: true, fromEmail: { not: null } },
    select: { fromEmail: true, patient: { select: { email: true } } },
  });
  return role?.fromEmail ?? role?.patient?.email ?? FALLBACK_EMAIL;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contactName,
      contactEmail,
      contactPhone,
      companyName,
      website,
      interestedTier,
      estimatedDonation,
      message,
    } = body;

    if (!contactName?.trim() || !contactEmail?.trim() || !companyName?.trim()) {
      return NextResponse.json(
        { error: "Contact name, email, and company name are required" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Create Sponsor record with INQUIRED status
    const sponsor = await prisma.sponsor.create({
      data: {
        name: companyName.trim(),
        website: website?.trim() || null,
        tier: interestedTier?.toUpperCase() || "PARTNER",
        isActive: false,
        status: SponsorStatus.INQUIRED,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone?.trim() || null,
        interestedTier: interestedTier || null,
        estimatedDonation: estimatedDonation?.trim() || null,
        inquiryMessage: message?.trim() || null,
        inquirySubmittedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: AuditAction.SPONSOR_INQUIRY_SUBMITTED,
        resourceType: "Sponsor",
        resourceId: sponsor.id,
        details: `Sponsor inquiry from ${contactEmail} — ${companyName} (${interestedTier ?? "custom"} tier)`,
      },
    });

    const toEmail = await getTreasurerEmail();
    const tierLabel = interestedTier
      ? interestedTier.charAt(0).toUpperCase() + interestedTier.slice(1).toLowerCase()
      : "Custom";

    // ── Notification to Treasurer ─────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: `HOEP Sponsor Form <noreply@hemo-el-paso.org>`,
        to: toEmail,
        replyTo: contactEmail,
        subject: `New Sponsorship Inquiry — ${companyName} — ${tierLabel} tier`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#8B1538">New Sponsorship Inquiry</h2>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Contact Name:</strong> ${contactName}</p>
            <p><strong>Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>
            ${contactPhone ? `<p><strong>Phone:</strong> ${contactPhone}</p>` : ""}
            ${website ? `<p><strong>Website:</strong> <a href="${website}">${website}</a></p>` : ""}
            <p><strong>Interested Tier:</strong> ${tierLabel}</p>
            ${estimatedDonation ? `<p><strong>Estimated Donation:</strong> ${estimatedDonation}</p>` : ""}
            ${message ? `<p><strong>Message:</strong><br/>${message}</p>` : ""}
            <hr style="border-color:#e5e7eb;margin:24px 0"/>
            <p style="color:#6b7280;font-size:13px">Sponsor ID: ${sponsor.id}</p>
            <p style="color:#6b7280;font-size:13px">Hemophilia Outreach of El Paso</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send sponsor notification:", emailError);
    }

    // ── Auto-reply to inquirer ────────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: `HOEP <info@hemo-el-paso.org>`,
        to: contactEmail,
        subject: "We received your sponsorship inquiry — HOEP",
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2 style="color:#8B1538">Thank you, ${contactName}!</h2>
            <p>We received your sponsorship inquiry for the <strong>${tierLabel}</strong> tier on behalf of <strong>${companyName}</strong>.</p>
            <p>Our team will review your inquiry and reach out within 1–2 business days.</p>
            <hr style="border-color:#e5e7eb;margin:24px 0"/>
            <p style="color:#6b7280;font-size:13px">Hemophilia Outreach of El Paso<br/>info@hemo-el-paso.org</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send sponsor confirmation:", emailError);
    }

    return NextResponse.json({ success: true, sponsorId: sponsor.id });
  } catch (error) {
    console.error("Sponsor inquiry error:", error);
    return NextResponse.json(
      { error: "Failed to submit sponsorship inquiry. Please try again." },
      { status: 500 },
    );
  }
}
