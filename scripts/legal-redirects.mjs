/**
 * 308 redirects from other likely addresses of the legal pages to the real ones, so a typed, printed or pasted link
 * does not 404. The only addresses the app itself has ever linked are /privacy, /terms, /children and /legal; these are
 * the common spellings around them. Used by next.config.mjs, tested by scripts/check-legal-links.ts.
 *
 *  - Spanish spellings and /es/... open the page in Spanish (?lang=es sets the language cookie, see middleware.ts).
 *  - The query string of the request is kept, so ?print=1 and ?lang= survive.
 *  - Matching ignores case and a trailing slash.
 *  - Never add a real route as a source.
 */
const PAGES = {
  "/privacy": {
    en: ["/privacy-policy", "/privacypolicy", "/privacy_policy", "/privacy-notice", "/legal/privacy", "/legal/privacy-policy", "/policies/privacy", "/policies/privacy-policy"],
    es: ["/privacidad", "/politica-de-privacidad", "/aviso-de-privacidad", "/legal/privacidad"],
  },
  "/terms": {
    en: ["/terms-of-use", "/terms-of-service", "/terms-and-conditions", "/terms-conditions", "/termsofuse", "/termsofservice", "/tos", "/legal/terms", "/legal/terms-of-use", "/policies/terms", "/policies/terms-of-service"],
    es: ["/terminos", "/terminos-de-uso", "/terminos-y-condiciones", "/legal/terminos"],
  },
  "/children": {
    en: ["/children-policy", "/childrens-policy", "/childrenspolicy", "/children-privacy", "/childrens-privacy", "/children-privacy-policy", "/children-and-age-policy", "/childrens-and-age-policy", "/age-policy", "/legal/children", "/legal/children-policy", "/policies/children"],
    es: ["/politica-para-menores", "/politica-para-menores-y-edad", "/politica-de-menores", "/menores", "/legal/menores"],
  },
};

export const LEGAL_REDIRECTS = Object.entries(PAGES).flatMap(([page, { en, es }]) => [
  ...en.map((source) => [source, page]),
  ...es.map((source) => [source, `${page}?lang=es`]),
  // language-prefixed and "print version" spellings
  [`/en${page}`, `${page}?lang=en`],
  [`/es${page}`, `${page}?lang=es`],
  [`${page}/print`, `${page}?print=1`],
]);

export const legalRedirects = () => LEGAL_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true }));
