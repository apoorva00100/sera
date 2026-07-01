import { useState } from "react";
import type { SessionEvent } from "@ape/types";

type GateEvent = Extract<SessionEvent, { type: "gate" }>;

interface Props {
  gate: GateEvent;
  onRespond: (choice: string) => void;
}

export function GateCard({ gate, onRespond }: Props) {
  const [submitted, setSubmitted] = useState(false);

  function handleClick(choice: string) {
    if (submitted) return;
    setSubmitted(true);
    onRespond(choice);
  }

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Decision Required
        </span>
      </div>
      <p className="mb-5 text-base font-medium text-gray-900">{gate.question}</p>
      <div className="flex flex-wrap gap-2">
        {gate.options.map((option) => (
          <button
            key={option}
            onClick={() => handleClick(option)}
            disabled={submitted}
            className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-opacity hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
