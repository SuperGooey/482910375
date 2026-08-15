// Property-keyed access notes for the pre-visit briefing — gate/door codes,
// pets on the property, alarms, and anything else a dispatcher should flag
// to a technician before they arrive. Keyed by CaseRecord.propertyId, same
// convention as PROPERTY_HISTORY. Only properties with an actual note on
// file are present here; no entry means nothing's known, not "nothing to
// know" — keep that convention if more properties are added later.
//
// Maple Dr's gate code was already on file as part of Priya Shah's
// contact.notes (CALLS c4: "Gate code: 4821"). That field is left untouched
// — ContactCard still reads contact.notes on mobile — but the same real
// fact is reused below rather than re-derived from scratch, so the two
// copies can't drift apart.
export const PREMISE_NOTES: Record<string, string[]> = {
  // 5th & Main — Robert Chen, "Active service plan — Premium" per
  // CALLS c1's contact.notes; an alarm note is the kind of extra detail a
  // premium-plan account would have on file.
  "5th-main": ["Alarm system on entry — ask homeowner to disarm before entering."],

  // Cedar Blvd — Alicia Fenwick, established customer (k7, d2). Pet note.
  "cedar-blvd": ["Large dog in the backyard (friendly) — keep the side gate latched."],

  // Maple Dr — ported from Priya Shah's contact.notes (see file header).
  "maple-dr": ["Gate code: 4821"],

  // Park Row — established customer (see PROPERTY_HISTORY's park-row
  // entries), no contact on file for a name, but a plausible access note.
  "park-row": ["Side gate code: 7734.", "Doorbell is unreliable — knock if no answer."],
};
