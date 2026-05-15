"use client";
import type { Entry } from "@/db/schema";
import type { Period } from "@/lib/calculations";

type Props = {
  selected: Period;
  onChange: (p: Period) => void;
  entries: Entry[];
};

export function PeriodFilter({ selected, onChange, entries }: Props) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const years = Array.from(
    new Set(entries.map((e) => new Date(e.date).getFullYear()))
  ).sort((a, b) => a - b);

  const yearChips: Period[] = years.map((y) =>
    y === currentYear ? `${y} YTD` : String(y)
  );

  const chips: Period[] = ["3m", "6m", "12m", ...yearChips, "all-time"];

  const label = (chip: Period) => (chip === "all-time" ? "All-time" : chip);

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip === selected;
        return (
          <button
            key={chip}
            onClick={() => onChange(chip)}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            style={
              active
                ? { background: "#1E3A4A", color: "#F5F0E8", border: "1px solid #1E3A4A" }
                : { background: "transparent", color: "#1E3A4A", border: "1px solid #E2D9CC" }
            }
          >
            {label(chip)}
          </button>
        );
      })}
    </div>
  );
}
