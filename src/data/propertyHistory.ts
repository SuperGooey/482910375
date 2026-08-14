import type { ServiceHistoryEntry } from "../types";

// Past-visit history for the "service history" panel on the case detail
// view, keyed by CaseRecord.propertyId. Roughly half of the ten addresses
// in mockData.ts are established customers with a multi-visit history here;
// the other half are brand-new customers/leads with no prior relationship
// on file (per contextItems like "None on record" and bare phone/address
// matches with no CRM account). Those addresses are simply omitted from
// this map entirely — no entry means no history, rather than an empty
// array — keep that convention if more properties are added later.
//
// Every entry here is dated before the app's simulated "today" (2026-08-14)
// and, where the rest of the mock data already states a specific prior
// service date/job for an address (5th & Main, Maple Dr), an entry below
// matches that detail rather than contradicting it.
export const PROPERTY_HISTORY: Record<string, ServiceHistoryEntry[]> = {
  // 5th & Main — CALLS c1 contact is a "Phone + account match" and its
  // contextItems already state: water heater installed 3 years ago, last
  // serviced 8 months ago for an anode rod replacement. Entries below land
  // on those same rough dates/jobs.
  "5th-main": [
    {
      id: "5th-main-1",
      date: "2023-08-02",
      techUnit: "Tech · L. Kim",
      jobType: "Water Heater",
      summary: "Installed new 50-gallon electric water heater to replace a failed unit.",
      cost: 1240,
    },
    {
      id: "5th-main-2",
      date: "2024-11-15",
      techUnit: "Tech · M. Alvarez",
      jobType: "Water Heater",
      summary: "Annual water heater flush and inspection; checked pressure relief valve.",
      cost: 145,
    },
    {
      id: "5th-main-3",
      date: "2025-12-10",
      techUnit: "Tech · M. Alvarez",
      jobType: "Water Heater",
      summary: "Replaced corroded anode rod to prevent tank corrosion and extend service life.",
      cost: 185,
    },
    {
      id: "5th-main-4",
      date: "2026-05-22",
      techUnit: "Tech · J. Diaz",
      jobType: "Electrical",
      summary: "Investigated intermittent breaker trips; tightened a loose connection at the heater disconnect.",
      cost: 165,
    },
  ],

  // Cedar Blvd — k7 and COMPLETED_CALLS d2 both show Alicia Fenwick with a
  // "CRM account" matchSource across two separate interactions, indicating
  // an established relationship. No "none on record" signal anywhere for
  // this address. Same tech (S. Patel) recurs, consistent with k7's
  // upcoming furnace inspection being assigned to S. Patel too.
  "cedar-blvd": [
    {
      id: "cedar-blvd-1",
      date: "2024-03-18",
      techUnit: "Tech · S. Patel",
      jobType: "HVAC",
      summary: "Spring furnace tune-up and filter replacement; verified heat exchanger integrity.",
      cost: 165,
    },
    {
      id: "cedar-blvd-2",
      date: "2024-09-05",
      techUnit: "Tech · A. Brooks",
      jobType: "HVAC",
      summary: "Replaced AC condenser fan motor after the unit stopped cooling.",
      cost: 410,
    },
    {
      id: "cedar-blvd-3",
      date: "2025-04-02",
      techUnit: "Tech · S. Patel",
      jobType: "Plumbing",
      summary: "Cleared a slow kitchen drain and replaced the P-trap gasket.",
      cost: 150,
    },
    {
      id: "cedar-blvd-4",
      date: "2025-10-21",
      techUnit: "Tech · S. Patel",
      jobType: "HVAC",
      summary: "Fall furnace inspection; replaced an igniter showing intermittent failures.",
      cost: 220,
    },
  ],

  // Willow Ct — k4's contextItem says "No prior gas-related calls at this
  // property" — a scoped negative signal about gas specifically, not a
  // blanket "none on record" for the address. History below is deliberately
  // gas-free to stay consistent with that note.
  "willow-ct": [
    {
      id: "willow-ct-1",
      date: "2023-11-08",
      techUnit: "Tech · J. Alvarez",
      jobType: "Plumbing",
      summary: "Replaced worn shutoff valves under the kitchen sink and resealed supply lines.",
      cost: 175,
    },
    {
      id: "willow-ct-2",
      date: "2024-06-30",
      techUnit: "Tech · R. Lopez",
      jobType: "HVAC",
      summary: "AC refrigerant recharge and coil cleaning; unit was low on refrigerant.",
      cost: 260,
    },
    {
      id: "willow-ct-3",
      date: "2025-02-14",
      techUnit: "Tech · K. Nguyen",
      jobType: "Electrical",
      summary: "Replaced a faulty GFCI outlet in the bathroom that was tripping repeatedly.",
      cost: 140,
    },
    {
      id: "willow-ct-4",
      date: "2025-09-19",
      techUnit: "Tech · J. Alvarez",
      jobType: "Plumbing",
      summary: "Repaired a running toilet — replaced the fill valve and flapper.",
      cost: 120,
    },
  ],

  // Maple Dr — CALLS c4 contact.notes states "Last service: Oct 2025 —
  // garbage disposal", and its contextItems separately note the address
  // "was serviced 14 months ago for a different fixture" (i.e. not the
  // kitchen faucet currently being called in about). Both facts are
  // represented below with matching dates/jobs, plus J. Alvarez recurring
  // as the "same technician" k5's contextItem refers to.
  "maple-dr": [
    {
      id: "maple-dr-1",
      date: "2023-09-14",
      techUnit: "Tech · R. Kim",
      jobType: "Plumbing",
      summary: "Installed a new kitchen faucet aerator and resolved a low water pressure complaint.",
      cost: 95,
    },
    {
      id: "maple-dr-2",
      date: "2025-06-20",
      techUnit: "Tech · J. Alvarez",
      jobType: "Plumbing",
      summary: "Replaced the cartridge in the bathroom sink faucet after a persistent drip.",
      cost: 155,
    },
    {
      id: "maple-dr-3",
      date: "2025-10-11",
      techUnit: "Tech · J. Alvarez",
      jobType: "Plumbing",
      summary: "Cleared a jammed garbage disposal and replaced a worn flywheel.",
      cost: 175,
    },
    {
      id: "maple-dr-4",
      date: "2026-02-05",
      techUnit: "Tech · J. Alvarez",
      jobType: "Plumbing",
      summary: "Winterization check — inspected exposed pipes and outdoor spigots for freeze risk.",
      cost: 85,
    },
  ],

  // Park Row — no explicit signal either way (no contact object on k3, and
  // the address doesn't appear elsewhere). Used as the tie-breaker for a
  // roughly even longtime/new split: a clean resolved job with no "none on
  // record"/no-account red flags. Same tech (J. Diaz) recurs, matching k3's
  // currently assigned technician.
  "park-row": [
    {
      id: "park-row-1",
      date: "2024-01-25",
      techUnit: "Tech · R. Lopez",
      jobType: "HVAC",
      summary: "Repaired a blower motor capacitor on the furnace; restored heat.",
      cost: 195,
    },
    {
      id: "park-row-2",
      date: "2024-08-09",
      techUnit: "Tech · J. Diaz",
      jobType: "Electrical",
      summary: "Replaced a failing garage outlet and corrected reversed polarity wiring.",
      cost: 160,
    },
    {
      id: "park-row-3",
      date: "2025-05-17",
      techUnit: "Tech · J. Diaz",
      jobType: "Water Heater",
      summary: "Flushed sediment buildup from the water heater tank to improve efficiency.",
      cost: 130,
    },
  ],

  // Oak Ave, Birch St, Grove Ave, Pine St, and Elm St are new-customer /
  // no-relationship addresses (see the "None on record" contextItems on
  // Oak Ave and Birch St, the null contacts on Grove Ave/Elm St, and the
  // bare "Phone match" — no CRM account — on Pine St and Grove Ave) and are
  // intentionally left out of this map.
};
