/**
 * Run: npm run check:permissions (pure, no DB).
 * Pins the roles that hold the health-information permissions, because the published Privacy Policy says
 * "Health information is visible only to the President and Vice President".
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ROLE_PERMISSIONS, type Permission } from "../src/lib/permissions";

const holders = (p: Permission) =>
  Object.entries(ROLE_PERMISSIONS)
    .filter(([, perms]) => perms.includes(p))
    .map(([role]) => role)
    .sort();

test("canViewPHI is held by PRESIDENT and VICE_PRESIDENT only", () => {
  assert.deepEqual(holders("canViewPHI"), ["PRESIDENT", "VICE_PRESIDENT"]);
});

test("canReviewVerification is held by PRESIDENT and VICE_PRESIDENT only", () => {
  assert.deepEqual(holders("canReviewVerification"), ["PRESIDENT", "VICE_PRESIDENT"]);
});
