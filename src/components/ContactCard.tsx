import { User } from "lucide-react";
import { matchColors } from "../theme/colors";
import type { Contact } from "../types";
import { Card } from "./primitives/Card";
import { Pill } from "./primitives/Pill";

export function ContactCard({ contact }: { contact: Contact }) {
  const c = matchColors(contact.matchConfidence);
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#EEF1FD] flex items-center justify-center shrink-0">
            <User size={15} className="text-[#3B5BDB]" />
          </div>
          <div className="text-[14px] font-semibold truncate">{contact.name}</div>
        </div>
        <Pill className="shrink-0" style={{ color: c.fg, backgroundColor: c.dot + "22" }}>
          {contact.matchConfidence}%
        </Pill>
      </div>
      <div className="text-[11px] text-[#6B7280] mb-2">{contact.matchSource}</div>
      {contact.notes && contact.notes.length > 0 && (
        <div className="flex flex-col gap-1">
          {contact.notes.map((n, i) => (
            <div key={i} className="text-[12px] text-[#454B5C] leading-snug">
              · {n}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
