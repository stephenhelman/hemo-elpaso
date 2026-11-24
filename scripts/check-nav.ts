/**
 * Header account button and menu. Run: npm run check:nav   (pure, no DB, no browser)
 * Covers the four session types: signed out, family, board, admin@ (board mode, no household), each in English and
 * Spanish, plus the desktop-vs-mobile placement of the sign-in button and the toggle-dependent label.
 */
import "./_react-global";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { accountLinks, parseAccess, signInHref, signInLabel, type AccountState } from "../src/lib/nav/account";
import { accessHeaders } from "../src/lib/identity/access";
import { AccountMenuItems, SignInLink } from "../src/components/layout/UserMenu";

const FAMILY: AccountState = { mode: "family", hasHousehold: true };
const BOARD_HH: AccountState = { mode: "board", hasHousehold: true };
const BOARD_ONLY: AccountState = { mode: "board", hasHousehold: false };
const ADMIN: AccountState = { mode: "board", hasHousehold: false }; // admin@: board mode, never a household
const user = { name: "Pat Example", email: "pat@example.org" };
const menu = (access: AccountState, lang: "en" | "es" = "en") => renderToStaticMarkup(h(AccountMenuItems, { lang, user, access }));

test("link model: board -> Board (+ My household if linked); family -> My household only; unknown -> nothing", () => {
  assert.deepEqual(accountLinks(BOARD_HH).map((l) => l.key), ["board", "household"]);
  assert.deepEqual(accountLinks(BOARD_ONLY).map((l) => l.key), ["board"]);
  assert.deepEqual(accountLinks(ADMIN).map((l) => l.key), ["board"]);
  assert.deepEqual(accountLinks(FAMILY), [{ key: "household", href: "/portal" }]);
  assert.deepEqual(accountLinks({ mode: "family", hasHousehold: false }).map((l) => l.key), ["household"]);
  assert.deepEqual(accountLinks({ mode: "none", hasHousehold: false }).map((l) => l.key), ["household"]);
  assert.deepEqual(accountLinks({ mode: null, hasHousehold: false }), [], "no link flashes before the server answers");
  for (const m of ["family", "none", null] as const) assert.ok(!accountLinks({ mode: m, hasHousehold: true }).some((l) => l.key === "board"), `${m} never sees Board`);
});

test("family session: the menu has no board link and no Admin Dashboard text, in both languages", () => {
  for (const lang of ["en", "es"] as const) {
    const html = menu(FAMILY, lang);
    assert.ok(!html.includes("/admin"), "no /admin href");
    assert.ok(!/Admin Dashboard|Panel de administración|>Board<|>Junta</.test(html));
    assert.ok(html.includes('href="/portal"'));
    assert.ok(html.includes(lang === "en" ? "My household" : "Mi hogar"));
    assert.ok(html.includes("/api/auth/logout"));
  }
});
test("board session: Board link, and My household only when a household is linked", () => {
  const withHh = menu(BOARD_HH);
  assert.ok(withHh.includes('href="/admin/dashboard"') && withHh.includes(">Board<") && withHh.includes('href="/portal"') && withHh.includes("My household"));
  assert.ok(menu(BOARD_HH, "es").includes(">Junta<") && menu(BOARD_HH, "es").includes("Mi hogar"));
  const boardOnly = menu(BOARD_ONLY);
  assert.ok(boardOnly.includes('href="/admin/dashboard"') && !boardOnly.includes("/portal") && !boardOnly.includes("My household"));
});
test("admin@ session: Board only (it never has a household)", () => {
  const html = menu(ADMIN);
  assert.ok(html.includes(">Board<") && !html.includes("My household") && !html.includes("/portal"));
});
test("unknown mode (before the answer arrives) shows only Log out", () => {
  const html = menu({ mode: null, hasHousehold: false });
  assert.ok(!html.includes("/admin") && !html.includes("/portal") && html.includes("/api/auth/logout"));
});

test("signed out: label and destination follow the family_portal toggle, EN and ES", () => {
  assert.equal(signInLabel(false, "en"), "Board sign-in");
  assert.equal(signInLabel(false, "es"), "Inicio de sesión de la junta");
  assert.equal(signInLabel(true, "en"), "Sign in");
  assert.equal(signInLabel(true, "es"), "Iniciar sesión");
  assert.equal(signInHref(false), "/api/auth/login?returnTo=/admin");
  assert.equal(signInHref(true), "/api/auth/login?returnTo=/portal");
});
test("signed out: desktop button is hidden below lg; the mobile one is hidden at lg and up (never both on screen)", () => {
  const d = renderToStaticMarkup(h(SignInLink, { lang: "en", familyPortal: false, variant: "desktop" }));
  const m = renderToStaticMarkup(h(SignInLink, { lang: "en", familyPortal: false, variant: "mobile" }));
  assert.ok(/class="hidden lg:inline-flex /.test(d) && d.includes("Board sign-in") && d.includes('href="/api/auth/login?returnTo=/admin"'));
  assert.ok(/class="lg:hidden /.test(m) && m.includes("Board sign-in"));
  const on = renderToStaticMarkup(h(SignInLink, { lang: "es", familyPortal: true, variant: "desktop" }));
  assert.ok(on.includes("Iniciar sesión") && on.includes("returnTo=/portal"));
});

test("access answer: headers for each session type, and how the menu parses them (never 'board' by accident)", () => {
  assert.deepEqual(accessHeaders({ mode: "board", hasHousehold: true }), { "x-hoep-mode": "board", "x-hoep-household": "1" });
  assert.deepEqual(parseAccess(200, "board", "1"), BOARD_HH);
  assert.deepEqual(parseAccess(200, "family", "1"), FAMILY);
  assert.deepEqual(parseAccess(200, "board", "0"), BOARD_ONLY);
  assert.equal(parseAccess(401, null, null), null, "signed out");
  assert.deepEqual(parseAccess(200, "garbage", "1"), { mode: "none", hasHousehold: true });
  assert.deepEqual(parseAccess(500, "board", "1"), { mode: "none", hasHousehold: false });
  assert.deepEqual(parseAccess(200, null, null), { mode: "none", hasHousehold: false });
});
