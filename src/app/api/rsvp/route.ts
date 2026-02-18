import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { render } from "@react-email/render";
import RsvpConfirmation from "@/messages/RsvpConfirmation";
import RsvpCancellation from "@/messages/RsvpCancellation";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, adultsCount, childrenCount, dietaryNotes } = body;

    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      include: {
        profile: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Event is not open for registration" },
        { status: 400 },
      );
    }

    // Check if RSVP deadline has passed
    if (event.rsvpDeadline && new Date() > new Date(event.rsvpDeadline)) {
      return NextResponse.json(
        { error: "RSVP deadline has passed" },
        { status: 400 },
      );
    }

    // Check capacity
    const totalAttendees = adultsCount + childrenCount;
    const currentRsvps = event._count.rsvps;
    const maxCapacity = event.maxCapacity || 999;

    if (currentRsvps + totalAttendees > maxCapacity) {
      return NextResponse.json(
        { error: "Event is at capacity" },
        { status: 400 },
      );
    }

    // Check if already RSVP'd
    const existingRsvp = await prisma.rsvp.findFirst({
      where: {
        patientId: patient.id,
        eventId: eventId,
      },
    });

    if (existingRsvp) {
      return NextResponse.json(
        { error: "You have already RSVP'd to this event" },
        { status: 409 },
      );
    }

    // Create RSVP
    const rsvp = await prisma.rsvp.create({
      data: {
        patientId: patient.id,
        eventId: eventId,
        adultsAttending: adultsCount,
        childrenAttending: childrenCount,
        dietaryRestrictions: dietaryNotes || null,
        status: "confirmed",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "rsvp_created",
        resourceType: "Event",
        resourceId: eventId,
        details: `RSVP created for ${event.titleEn} - ${totalAttendees} attendees`,
      },
    });

    // Generate QR code for email
    const qrData = `RSVP-${rsvp.id}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 500,
      margin: 2,
      color: {
        dark: "#8B1538",
        light: "#FFFFFF",
      },
    });

    // Convert base64 to buffer for email attachment
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, "base64");

    // Send confirmation email
    try {
      console.log("Attempting to send email to:", patient.email);

      const emailHtml = await render(
        RsvpConfirmation({
          patientName: `${patient.profile?.firstName} ${patient.profile?.lastName}`,
          eventTitle: event.titleEn,
          eventDate: new Date(event.eventDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          eventTime: new Date(event.eventDate).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          location: event.location,
          adultsCount,
          childrenCount,
          qrCodeDataUrl: "cid:qrcode", // Use CID reference instead
          eventSlug: event.slug,
        }),
      );

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: patient.email,
        replyTo: "info@hemo-el-paso.org",
        subject: `RSVP Confirmed: ${event.titleEn}`,
        html: emailHtml,
        attachments: [
          {
            filename: "qr-code.png",
            content: qrBuffer,
            contentId: "qrcode",
          },
        ],
      });

      console.log("Resend response:", result);

      if (result.error) {
        console.error("Resend error:", result.error);
      } else {
        console.log("Email sent successfully! ID:", result.data?.id);
      }
    } catch (emailError) {
      console.error("Email send error:", emailError);
    }

    return NextResponse.json({
      success: true,
      rsvp: {
        id: rsvp.id,
        eventId: rsvp.eventId,
      },
    });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Failed to create RSVP" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rsvpId = searchParams.get("id");

    if (!rsvpId) {
      return NextResponse.json({ error: "RSVP ID required" }, { status: 400 });
    }

    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      include: {
        profile: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Verify ownership
    const rsvp = await prisma.rsvp.findUnique({
      where: { id: rsvpId },
      include: { event: true },
    });

    if (!rsvp || rsvp.patientId !== patient.id) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    // Delete RSVP
    await prisma.rsvp.delete({
      where: { id: rsvpId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "rsvp_cancelled",
        resourceType: "Event",
        resourceId: rsvp.eventId,
        details: `RSVP cancelled for ${rsvp.event.titleEn}`,
      },
    });

    // Send cancellation email
    try {
      const emailHtml = await render(
        RsvpCancellation({
          patientName: `${patient.profile?.firstName} ${patient.profile?.lastName}`,
          eventTitle: rsvp.event.titleEn,
          eventDate: new Date(rsvp.event.eventDate).toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            },
          ),
          eventTime: new Date(rsvp.event.eventDate).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
            },
          ),
          eventSlug: rsvp.event.slug,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: patient.email,
        replyTo: "info@hemo-el-paso.org",
        subject: `RSVP Cancelled: ${rsvp.event.titleEn}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Cancellation email error:", emailError);
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel RSVP" },
      { status: 500 },
    );
  }
}
