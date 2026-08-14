import type { CaseRecord } from "../../types";
import { CaseCard } from "./CaseCard";

export function CasesScreen({ cases, onOpen }: { cases: CaseRecord[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {cases.map((k) => (
        <CaseCard key={k.id} k={k} onOpen={onOpen} />
      ))}
    </div>
  );
}
