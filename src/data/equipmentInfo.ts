import type { EquipmentInfo } from "../types";

// Structured make/model/warranty info for equipment on file at a property,
// for the case detail's pre-visit briefing panel. Keyed by
// CaseRecord.propertyId, same convention as PROPERTY_HISTORY.
//
// Distinct from the vague equipment mentions already sitting in some
// contextItems (e.g. "Water heater installed 3 years ago", "Central AC
// unit, approx. 8 years old") — those are free-text hints pulled from the
// call itself, whereas this is the structured record with an actual
// make/model/warranty a dispatcher can check. Where a contextItem already
// describes a piece of equipment at one of these properties, the entry
// below is consistent with it (same equipment, matching rough age/date)
// while adding real specificity on top, never contradicting or just
// re-wording what's already shown there.
//
// Populated for a handful of properties only ("if we know that info" for
// this address), independent of which properties have PROPERTY_HISTORY —
// some overlap, some not. Manufacturer names are fictional; this is demo
// data and shouldn't imply association with real appliance brands.
export const EQUIPMENT_INFO: Record<string, EquipmentInfo[]> = {
  // 5th & Main — CALLS c1 / CASES k1 contextItems already say the water
  // heater was "installed 3 years ago" and is "still under manufacturer
  // warranty until next year." The install date below lands on the exact
  // date PROPERTY_HISTORY's 5th-main-1 entry records as the water heater
  // install job, and the warranty expiration lands in 2027 — "next year"
  // relative to the app's simulated "today" (2026-08-14).
  "5th-main": [
    {
      id: "5th-main-eq1",
      type: "Water Heater",
      make: "Thermablock",
      model: "T-50E",
      installDate: "2023-08-02",
      warrantyStatus: "active",
      warrantyExpiration: "2027-08-02",
      manualAvailable: true,
      partsAvailable: true,
    },
  ],

  // Birch St — CALLS c3 / CASES k10 contextItems already say "Central AC
  // unit, approx. 8 years old." Install date below lands ~8 years before
  // today. Warranty has lapsed, which tracks with today's call being a full
  // no-cooling failure rather than a routine covered check-up.
  "birch-st": [
    {
      id: "birch-st-eq1",
      type: "Central AC",
      make: "Coastline",
      model: "CL-24X",
      installDate: "2018-03-10",
      warrantyStatus: "expired",
      warrantyExpiration: "2023-03-10",
      manualAvailable: true,
      partsAvailable: false,
    },
  ],

  // Cedar Blvd — no equipment mention in any contextItem for this address,
  // so this is purely additive. PROPERTY_HISTORY shows recurring furnace
  // tune-ups (2024, 2025) and an AC condenser fan motor replacement
  // (2024-09-05); a decade-old system needing that kind of repeat
  // attention is consistent with an aging, since-expired-warranty system
  // installed as one job (furnace + AC together).
  "cedar-blvd": [
    {
      id: "cedar-blvd-eq1",
      type: "Furnace",
      make: "Northbridge",
      model: "NB-90V",
      installDate: "2014-10-02",
      warrantyStatus: "expired",
      warrantyExpiration: "2024-10-02",
      manualAvailable: true,
      partsAvailable: true,
    },
    {
      id: "cedar-blvd-eq2",
      type: "Central AC",
      make: "Northbridge",
      model: "NB-24SC",
      installDate: "2014-10-02",
      warrantyStatus: "expired",
      warrantyExpiration: "2024-10-02",
      manualAvailable: true,
      partsAvailable: true,
    },
  ],

  // Maple Dr — CALLS c4 / CASES k5 contextItems already describe "a
  // standard single-handle kitchen faucet" (the fixture on today's call)
  // and separately note the address "was serviced 14 months ago for a
  // different fixture" (PROPERTY_HISTORY's maple-dr-2 bathroom-sink
  // cartridge job — left alone, not the same unit as either entry below).
  // The garbage disposal entry lines up with contact.notes' "Last service:
  // Oct 2025 — garbage disposal" and PROPERTY_HISTORY's maple-dr-3 jammed
  // disposal/flywheel repair.
  "maple-dr": [
    {
      id: "maple-dr-eq1",
      type: "Kitchen Faucet",
      make: "Cascata",
      model: "FX-210 Single-Handle",
      installDate: "2021-04-12",
      warrantyStatus: "expired",
      warrantyExpiration: "2023-04-12",
      manualAvailable: true,
      partsAvailable: true,
    },
    {
      id: "maple-dr-eq2",
      type: "Garbage Disposal",
      make: "Grindwell",
      model: "GW-750",
      installDate: "2019-06-01",
      warrantyStatus: "expired",
      warrantyExpiration: "2021-06-01",
      manualAvailable: true,
      partsAvailable: false,
    },
  ],

  // Pine St — CASES k8 / COMPLETED_CALLS d1 both describe a routine
  // "seasonal AC tune-up" booking, not a repair. Pine St has no
  // PROPERTY_HISTORY on file (new customer), but a comparatively new,
  // still-under-warranty unit is exactly the kind of address that books
  // preventive maintenance instead of calling in over a failure.
  "pine-st": [
    {
      id: "pine-st-eq1",
      type: "Central AC",
      make: "Coastline",
      model: "CL-18X",
      installDate: "2023-05-20",
      warrantyStatus: "active",
      warrantyExpiration: "2033-05-20",
      manualAvailable: true,
      partsAvailable: true,
    },
  ],

  // Park Row, Willow Ct, Grove Ave, Oak Ave, and Elm St have no equipment
  // info on file — omitted from this map entirely, same "no entry means
  // unknown" convention as PROPERTY_HISTORY.
};
