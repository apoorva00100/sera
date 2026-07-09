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
    <div
      className="p-6"
      style={{
        borderRadius: "18px",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--accent) 11%, transparent), color-mix(in srgb, var(--accent) 4%, transparent))",
        border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
        boxShadow: "0 0 40px color-mix(in srgb, var(--accent) 14%, transparent)",
      }}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: "var(--accent)", boxShadow: "0 0 9px var(--accent)" }}
        />
        <span
          className="text-[11.5px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "color-mix(in srgb, var(--accent) 55%, white 45%)" }}
        >
          Decision required
        </span>
      </div>
      <p
        className="mb-[18px] text-[18px] font-semibold leading-[1.4]"
        style={{ color: "var(--heading)" }}
      >
        {gate.question}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {gate.options.map((option) => (
          <button
            key={option}
            onClick={() => handleClick(option)}
            disabled={submitted}
            className="ape-gate-opt cursor-pointer rounded-[11px] px-4 py-2.5 text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              color: "var(--body)",
              background: "rgba(20,15,13,0.6)",
              border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
