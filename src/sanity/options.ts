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
];

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
