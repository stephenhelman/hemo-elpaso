import { groq } from "next-sanity";

/**
 * Everything switched on, whatever its dates: the response is cached, so time is applied in code per request
 * (lib/announcements/rules). `hasConferenceSection` stops an announcement linking to a card that is not on the page.
 */
export const announcementsQuery = groq`{
  "announcements": *[_type == "announcement" && active == true]{
    _id, title, text, buttonLabel, order, startsAt, endsAt,
    "target": target{ kind, page, eventSlug, url,
      "conference": conference->{ _id, active, "slug": slug.current, organizer, endDate } }
  },
  "conferences": *[_type == "conference" && active == true && announceRegistration == true && defined(slug.current)]{
    _id, "slug": slug.current, name, organizer, startDate, endDate, registrationOpensAt, registrationClosesAt,
    announcementTitle, announcementText
  },
  "hasConferenceSection": count(*[_id == "resourcesPage"][0].sections[_type == "conferenceList"]) > 0
}`;
export const ANNOUNCEMENT_TAGS = ["announcement", "conference", "page:resources"];
