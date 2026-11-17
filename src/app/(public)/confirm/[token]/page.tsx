import type { Metadata } from "next";
import { resolveConfirmToken } from "@/lib/households/confirm";
import { prisma } from "@/lib/db";
import ConfirmForm from "@/components/household/ConfirmForm";

// Personal link: never index, never leak the token via Referer.
export const metadata: Metadata = {
  title: "Confirm",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: { token: string } }) {
  const m = await resolveConfirmToken(params.token);
  // Only first names + relationship + age group reach the page (no diagnoses, ever).
  const primary = m
    ? await prisma.contactProfile.findUnique({ where: { patientId: m.patientId }, select: { firstName: true } })
    : null;

  return (
    <div className="bg-neutral-50 min-h-[70vh] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <ConfirmForm
          token={params.token}
          member={
            m
              ? {
                  firstName: m.firstName ?? "",
                  lastName: m.lastName ?? "",
                  email: m.email ?? "",
                  relationship: m.relationship,
                  ageGroup: m.ageGroup,
                  primaryFirstName: primary?.firstName ?? "",
                }
              : null
          }
        />
      </div>
    </div>
  );
}
