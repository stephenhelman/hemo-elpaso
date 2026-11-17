/**
 * Timezone regression checks. Run: npm run check:timezone  (pure, no DB, no network).
 * The server runs in UTC; these assert Mountain Time output regardless of the
 * process TZ (also run with TZ=UTC and TZ=Asia/Tokyo to prove it).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatEventDate, formatEventTime, formatEventDateTime, tomorrowRangeUtc, siteDateKey,
  siteWallTimeToUtc, toSiteDatetimeLocal, fromSiteDatetimeLocal, siteDayRangeUtc, siteWeekdayHour,
} from "../src/lib/datetime";

// DST 2026 ended Nov 1, so on Nov 17 Mountain Time is MST (UTC-7): 6:30 PM local = 01:30Z the next day.
const EVENT = new Date("2026-11-18T01:30:00Z");
const inWindow = (d: Date, w: { start: Date; end: Date }) => d >= w.start && d < w.end;

test("event renders in Mountain Time (EN)", () => {
  assert.equal(formatEventDate(EVENT, "en", { year: false }), "Tuesday, November 17");
  assert.equal(formatEventTime(EVENT, "en"), "6:30 PM");
  assert.equal(formatEventDateTime(EVENT, "en", { year: false }), "Tuesday, November 17, 6:30 PM");
});

test("event renders in Mountain Time (ES)", () => {
  assert.equal(formatEventDate(EVENT, "es", { year: false }), "martes, 17 de noviembre");
  assert.match(formatEventTime(EVENT, "es"), /^6:30\s?p\.\s?m\.$/);
});

test("reminder: Nov 16 run picks the event, Nov 17 run does not", () => {
  // cron fires at various UTC times; any moment on Nov 16 Mountain Time must select it
  for (const now of ["2026-11-16T07:00:00Z", "2026-11-16T15:00:00Z", "2026-11-17T06:59:00Z"]) {
    assert.ok(inWindow(EVENT, tomorrowRangeUtc(new Date(now))), `selected at ${now}`);
  }
  // Nov 17 run (any time on the 17th MT): tomorrow is the 18th
  for (const now of ["2026-11-17T07:00:00Z", "2026-11-17T15:00:00Z", "2026-11-18T06:59:00Z"]) {
    assert.ok(!inWindow(EVENT, tomorrowRangeUtc(new Date(now))), `not selected at ${now}`);
  }
});

test("reminder window boundaries are Mountain midnight", () => {
  const w = tomorrowRangeUtc(new Date("2026-11-16T15:00:00Z"));
  assert.equal(w.start.toISOString(), "2026-11-17T07:00:00.000Z");
  assert.equal(w.end.toISOString(), "2026-11-18T07:00:00.000Z");
});

test("DST boundary: spring forward (Mar 8, 2026) day is 23h; fall back (Nov 1, 2026) is 25h", () => {
  const spring = siteDayRangeUtc("2026-03-08");
  assert.equal((spring.end.getTime() - spring.start.getTime()) / 3600000, 23);
  assert.equal(spring.start.toISOString(), "2026-03-08T07:00:00.000Z"); // MST, UTC-7
  assert.equal(spring.end.toISOString(), "2026-03-09T06:00:00.000Z"); // MDT, UTC-6
  const fall = siteDayRangeUtc("2026-11-01");
  assert.equal((fall.end.getTime() - fall.start.getTime()) / 3600000, 25);
  // an event at 6:30 PM MDT on Mar 8 (stored 00:30Z Mar 9) gets its reminder on the Mar 7 run, not Mar 8
  const marEvent = new Date("2026-03-09T00:30:00Z");
  assert.equal(formatEventDateTime(marEvent, "en", { year: false }), "Sunday, March 8, 6:30 PM");
  assert.ok(inWindow(marEvent, tomorrowRangeUtc(new Date("2026-03-07T18:00:00Z"))));
  assert.ok(!inWindow(marEvent, tomorrowRangeUtc(new Date("2026-03-08T18:00:00Z"))));
  // 6:30 PM MST on Nov 1 is 01:30Z Nov 2 ... and the 6:30 PM MDT/MST offsets differ by an hour
  assert.equal(siteWallTimeToUtc(2026, 10, 31, 18, 30).toISOString(), "2026-11-01T00:30:00.000Z"); // MDT
  assert.equal(siteWallTimeToUtc(2026, 11, 2, 18, 30).toISOString(), "2026-11-03T01:30:00.000Z"); // MST
});

test("calendar day key uses Mountain Time, not UTC", () => {
  assert.equal(siteDateKey(EVENT), "2026-11-17");
  assert.equal(siteWeekdayHour(EVENT).hour, 18);
  assert.equal(siteWeekdayHour(EVENT).weekday, 2); // Tuesday
});

test("datetime-local round trip is Mountain Time", () => {
  assert.equal(toSiteDatetimeLocal(EVENT), "2026-11-17T18:30");
  assert.equal(fromSiteDatetimeLocal("2026-11-17T18:30")!.toISOString(), EVENT.toISOString());
  assert.equal(fromSiteDatetimeLocal("nope"), null);
});
