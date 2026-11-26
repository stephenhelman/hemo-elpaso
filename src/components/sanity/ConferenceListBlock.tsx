"use client";

import Link from "next/link";
import { ArrowRight, Calendar, ClipboardList, ExternalLink, MapPin, Plane } from "lucide-react";
import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { conferenceTranslation } from "@/translation/conferences";
import { pick } from "@/sanity/helpers/pick";
import { formatDateKey, formatDateSpan, instant, isDateKey, safeHttpsUrl, travelLink } from "@/sanity/helpers/conferences";
import { siteDateKey } from "@/lib/datetime";
import type { Lang } from "@/types";
import type { ConferenceItem, Section as SectionData } from "@/sanity/types";
import SectionHeaderView from "./SectionHeaderView";

type List = Extract<SectionData, { _type: "conferenceList" }>;

/**
 * External conferences HOEP shares. Items arrive already filtered, with their registration and travel state computed on
 * the server (prepareConferenceSections). This component reads no clock.
 */
export default function ConferenceListBlock({ block, locale, anchorId }: { block: List; locale: Lang; anchorId?: string }) {
  const items = block.items ?? [];
  if (items.length === 0) return null;

  return (
    <Section background={block.background === "neutral" ? "neutral" : "white"} id={anchorId} className="scroll-mt-16">
      <SectionHeaderView header={block.header} locale={locale} />
      <div className={`grid grid-cols-1 gap-6 mx-auto ${items.length === 1 ? "max-w-2xl" : "md:grid-cols-2 max-w-5xl"}`}>
        {items.map((c) => (
          <ConferenceCard key={c._id} c={c} locale={locale} />
        ))}
      </div>
    </Section>
  );
}

function ExternalButton({ href, label, newTab, primary }: { href: string; label: string; newTab: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
        primary
          ? "bg-primary text-white border-primary hover:bg-primary-600"
          : "border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary"
      }`}
    >
      {label}
      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="sr-only">{newTab}</span>
    </a>
  );
}

function ConferenceCard({ c, locale }: { c: ConferenceItem; locale: Lang }) {
  const t = conferenceTranslation[locale];
  const name = pick(c.name, locale);
  const dates = formatDateSpan(c.startDate, c.endDate, locale);
  const place = [c.venue, c.city, c.state].filter(Boolean).join(", ");
  const mode = c.attendanceMode ? t.mode[c.attendanceMode] : null;
  const website = safeHttpsUrl(c.websiteUrl);
  // No registration button once the organizer's window has closed.
  const register = c.registration === "closed" ? null : safeHttpsUrl(c.registrationUrl);

  // An unreadable value is left out rather than breaking the page.
  const dayOf = (iso?: string | null) => (instant(iso) == null ? null : formatDateKey(siteDateKey(iso!), locale));
  const opens = dayOf(c.registrationOpensAt);
  const closes = dayOf(c.registrationClosesAt);
  const registration =
    c.registration === "closed" ? t.registrationClosed
    : c.registration === "upcoming" && opens ? t.registrationOpens(opens)
    : c.registration === "open" && closes ? t.registrationCloses(closes)
    : null;

  const note = pick(c.travelAssistanceNote, locale);
  const link = travelLink(c.travelAssistanceLink);

  return (
    // The id is the target of /resources#conference-<slug>; scroll-mt keeps the card clear of the sticky header.
    <div id={c.anchor ?? undefined} className="scroll-mt-24">
      <HoepCard className="flex h-full flex-col">
        <h3 className="font-display font-bold text-neutral-900 text-lg leading-snug">{name}</h3>
        {c.organizer && <p className="text-sm text-neutral-500 mt-1">{t.hostedBy(c.organizer)}</p>}

        <ul className="space-y-2 mt-4 text-sm text-neutral-600">
          {dates && (
            <li className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{dates}</span>
            </li>
          )}
          {(place || mode) && (
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{[place, mode].filter(Boolean).join(" · ")}</span>
            </li>
          )}
          {registration && (
            <li className="flex items-start gap-2">
              <ClipboardList className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{registration}</span>
            </li>
          )}
        </ul>

        <p className="text-neutral-600 text-sm leading-relaxed mt-4">{pick(c.summary, locale)}</p>

        {c.travelOpen && (
          <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Plane className="w-4 h-4 text-secondary flex-shrink-0" aria-hidden="true" />
              {t.travelTitle}
            </p>
            {note && <p className="text-sm text-neutral-700 leading-relaxed mt-2">{note}</p>}
            {isDateKey(c.travelAssistanceDeadline) && (
              <p className="text-sm text-neutral-700 mt-2">{t.travelDeadline(formatDateKey(c.travelAssistanceDeadline, locale))}</p>
            )}
            {link &&
              (link.external ? (
                <div className="mt-3">
                  <ExternalButton href={link.href} label={t.travelLink} newTab={t.newTab} />
                </div>
              ) : (
                <Link href={link.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600">
                  {t.travelLink}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              ))}
          </div>
        )}

        {(website || register) && (
          <div className="flex flex-wrap gap-3 mt-auto pt-5">
            {register && <ExternalButton href={register} label={t.register} newTab={t.newTab} primary />}
            {website && <ExternalButton href={website} label={t.website} newTab={t.newTab} />}
          </div>
        )}
      </HoepCard>
    </div>
  );
}
