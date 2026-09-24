"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { addDays, businessToday } from "@/lib/utils";

/**
 * A single day, with arrows.
 *
 * A native date input rather than a calendar component: it is one value, the
 * platform picker is already localised and keyboard-accessible, and the
 * arrows cover the motion that actually happens on these screens — stepping
 * back a day to check yesterday.
 */
export function DayPicker({
  value,
  onChange,
  label = "Day",
}: {
  value: string;
  onChange: (day: string) => void;
  label?: string;
}) {
  const today = businessToday();

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => onChange(addDays(value, -1))}>
        <ChevronLeft aria-hidden />
      </Button>
      <Input
        type="date"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value || today)}
        className="w-[9.5rem]"
      />
      <Button variant="outline" size="icon" aria-label="Next day" onClick={() => onChange(addDays(value, 1))}>
        <ChevronRight aria-hidden />
      </Button>
      {value !== today && (
        <Button variant="ghost" size="sm" onClick={() => onChange(today)}>
          Today
        </Button>
      )}
    </div>
  );
}
