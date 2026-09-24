"use client";

import { MobileShell } from "@/components/app/mobile-shell";
import { DataState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";
import { useQueryParam } from "@/hooks/use-query-param";
import type { StaffReservation, Timesheet } from "@/lib/api/types";
import { addDays, businessToday, formatDay, formatDistance, formatMNT, formatTime } from "@/lib/utils";
import { employeeNav } from "@/navigation/sidebar-items";

export function EmployeeTimesheetScreen() {
  const today = businessToday();
  const [range, setRange] = useQueryParam("range", "7");
  const days = Number(range) || 7;
  const from = addDays(today, -(days - 1));

  const sheet = useApi<Timesheet>("employee/timesheet", { from, to: today });
  // The bonus total comes from the jobs endpoint, not the timesheet: hours and
  // earnings are separate facts here exactly as they are on the manager's
  // report, and deriving one from the other would be a guess.
  const jobs = useApi<StaffReservation[]>("employee/jobs", { from, to: today });

  const bonus = (jobs.data ?? [])
    .filter((job) => job.status === "completed")
    .reduce((sum, job) => sum + job.bonus_mnt, 0);
  const washes = (jobs.data ?? []).filter((job) => job.status === "completed").length;

  return (
    <MobileShell
      title="My hours"
      nav={employeeNav}
      action={
        <div className="flex gap-1.5">
          {[
            { label: "7d", value: "7" },
            { label: "30d", value: "30" },
          ].map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={range === option.value ? "default" : "outline"}
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      }
    >
      <DataState query={sheet}>
        {(data) => (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="flex flex-col gap-1 pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Hours</span>
                  <span className="text-xl font-bold tabular-nums">{data.worked_hours.toFixed(1)}</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1 pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Washes</span>
                  <span className="text-xl font-bold tabular-nums">{washes}</span>
                </CardContent>
              </Card>
              <Card className="border-primary/30 bg-accent">
                <CardContent className="flex flex-col gap-1 pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-accent-foreground">Bonus</span>
                  <span className="text-xl font-bold tabular-nums text-accent-foreground">{formatMNT(bonus)}</span>
                </CardContent>
              </Card>
            </div>

            {data.open_entries > 0 && (
              <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
                {data.open_entries === 1 ? "One shift is" : `${data.open_entries} shifts are`} still running. An open
                entry counts zero hours until you clock out.
              </p>
            )}

            {data.entries.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No clock-ins in this period.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...data.entries].reverse().map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-3">
                    <div className="w-12 shrink-0">
                      <span className="block text-xs font-semibold">{formatDay(entry.clock_in_at).split(" ")[0]}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {formatDay(entry.clock_in_at).split(" ").slice(1).join(" ")}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-mono text-[13px]">
                        {formatTime(entry.clock_in_at)} → {entry.running ? "running" : formatTime(entry.clock_out_at)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {entry.location.name} · in at {formatDistance(entry.clock_in_distance_m)}
                        {entry.clock_out_distance_m !== undefined && entry.clock_out_distance_m >= 0
                          ? `, out at ${formatDistance(entry.clock_out_distance_m)}`
                          : ""}
                      </span>
                    </div>
                    {entry.running ? (
                      <Badge tone="warning">Open</Badge>
                    ) : (
                      <span className="text-[13px] font-semibold tabular-nums">
                        {(entry.worked_minutes / 60).toFixed(1)} h
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              Your manager sees these same rows, including the distances. A clock-out far from the site is recorded, not
              refused.
            </p>
          </div>
        )}
      </DataState>
    </MobileShell>
  );
}
