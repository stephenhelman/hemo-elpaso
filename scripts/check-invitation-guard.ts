/** Run: npm run check:invitation-guard (pure, no DB). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { invitationNamesCondition, namesACondition } from "../src/lib/invitations/condition-terms";

const ev = (over: object = {}) => ({ titleEn: "Family picnic", titleEs: "Picnic familiar", descriptionEn: "Fun", descriptionEs: "Diversión", targeting: { targetConditions: ["hemophilia_a"] }, ...over });

test("each term, any case, either language", () => {
  for (const t of ["Hemophilia night", "HEMOFILIA", "von Willebrand support", "Von-Willebrand", "VWD families", "factor workshop", "Carrier day", "Día de portadoras", "portador", "PORTADORA"])
    assert.equal(namesACondition(t), true, t);
});
test("no false alarms on ordinary words", () => {
  for (const t of ["Family picnic", "Carrie's party", "Factory tour", "Importadora", "Back to school", null, ""]) assert.equal(namesACondition(t), false, String(t));
});
test("only warns when the event is diagnosis-targeted", () => {
  assert.equal(invitationNamesCondition(ev({ titleEn: "Hemophilia picnic" })), true);
  assert.equal(invitationNamesCondition(ev({ descriptionEs: "para portadoras" })), true);
  assert.equal(invitationNamesCondition(ev({ titleEn: "Hemophilia picnic", targeting: { targetConditions: [] } })), false);
  assert.equal(invitationNamesCondition(ev({ titleEn: "Hemophilia picnic", targeting: null })), false);
  assert.equal(invitationNamesCondition(ev()), false);
});
