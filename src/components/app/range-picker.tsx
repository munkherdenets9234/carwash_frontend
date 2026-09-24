"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { addDays, businessToday } from "@/lib/utils";

/**
 * A from/to day range, inclusive at both ends — which is what the API means
 * by ?from=&to= (it turns `to` into the start of the next day server-side).
 * Showing an exclusive end would make "1st to 7th" quietly omit the 7th.
 */
export function RangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
}) {
  const today = businessToday();

  const presets = [
    { label: "Today", from: today, to: today },
    { label: "7 days", from: addDays(today, -6), to: today },
    { label: "30 days", from: addDays(today, -29), to: today },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map((preset) => {
        const active = preset.from === from && preset.to === to;
        return (
          <Button
            key={preset.label}
            variant={active ? "default" : "outline"}
            size="sm"
            aria-pressed={active}
            onClick={() => onChange({ from: preset.from, to: preset.to })}
          >
            {preset.label}
          </Button>
        );
      })}
      <Input
        type="date"
        aria-label="From"
        value={from}
        max={to}
        onChange={(e) => onChange({ from: e.target.value || today, to })}
        className="w-[9.5rem]"
      />
      <Input
        type="date"
        aria-label="To"
        value={to}
        min={from}
        onChange={(e) => onChange({ from, to: e.target.value || today })}
        className="w-[9.5rem]"
      />
    </div>
  );
}
