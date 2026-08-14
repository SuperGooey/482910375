import type { Contact } from "../types";

// how confident an identity match needs to be before we show the person's
// name instead of a fallback — one constant instead of a magic number
// repeated at every call site that touches contact matching
export const CONTACT_MATCH_THRESHOLD = 50;

export function displayName(contact: Contact | null | undefined, fallback: string | null = null): string | null {
  return contact && contact.matchConfidence >= CONTACT_MATCH_THRESHOLD ? contact.name : fallback;
}
