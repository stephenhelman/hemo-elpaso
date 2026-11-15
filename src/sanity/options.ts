/** Editor-facing fixed lists. Values are stored; code maps them to Lucide icons / Tailwind tokens. */
export const ICON_OPTIONS = [
  { title: "Heart", value: "heart" },
  { title: "Clock", value: "clock" },
  { title: "Dollar sign", value: "dollarSign" },
  { title: "Megaphone", value: "megaphone" },
  { title: "Book", value: "bookOpen" },
  { title: "People", value: "users" },
  { title: "Globe", value: "globe" },
  { title: "Shield", value: "shield" },
  { title: "Phone", value: "phone" },
  { title: "Mail", value: "mail" },
  { title: "Calendar", value: "calendar" },
  { title: "Clipboard", value: "clipboardList" },
  { title: "Bell", value: "bell" },
  { title: "Star", value: "star" },
  { title: "Arrow", value: "arrowRight" },
  { title: "Sun", value: "sun" },
];

/** Emoji an editor may use as a card visual (fixed list). */
export const EMOJI_OPTIONS = ["🎯", "⭐", "🏆", "❤️", "🤝", "📚", "🏥", "👨‍👩‍👧"].map((e) => ({ title: e, value: e }));

export const COLOR_OPTIONS = [
  { title: "Primary (burgundy)", value: "primary" },
  { title: "Secondary", value: "secondary" },
  { title: "Accent", value: "accent" },
  { title: "Neutral", value: "neutral" },
];

/** Internal routes an editor may link to. Fixed list: no free typing of paths. */
export const INTERNAL_ROUTES: readonly (readonly [string, string])[] = [
  ["/", "Home"],
  ["/about", "About"],
  ["/events", "Events"],
  ["/resources", "Resources"],
  ["/scholarships", "Scholarships"],
  ["/get-involved", "Get Involved"],
  ["/contact", "Contact"],
  ["/register-info", "Register for Information"],
];

export const RESOURCE_CATEGORIES = [
  { title: "Condition information", value: "condition" },
  { title: "National organization", value: "nationalOrg" },
  { title: "Local care", value: "localCare" },
  { title: "Youth program", value: "youthProgram" },
  { title: "Financial help", value: "financialHelp" },
];

/** A resource not re-checked within this many months is shown as stale in the Studio. */
export const STALE_AFTER_MONTHS = 12;
export const isStale = (iso?: string | null, now: Date = new Date()) => {
  if (!iso) return true;
  const d = new Date(`${iso}T12:00:00`);
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() - STALE_AFTER_MONTHS);
  return d < limit;
};
