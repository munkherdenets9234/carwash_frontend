"use client";

import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { SignOutButton } from "@/components/app/sign-out-button";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";
import type { Location, Shift, StaffReservation, TimeEntry } from "@/lib/api/types";
import { businessToday, formatDay, formatMNT, formatRange, formatTime } from "@/lib/utils";
import { employeeNav } from "@/navigation/sidebar-items";

import { ClockCard } from "./clock-card";

export function TodayScreen({ name, email }: { name?: string; email?: string }) {
  const today = businessToday();
  const current = useApi<TimeEntry | null>("employee/attendance/current");
  const shifts = useApi<Shift[]>("employee/shifts", { from: today, to: today });
  const jobs = useApi<StaffReservation[]>("employee/jobs", { from: today, to: today });
  const locations = useApi<Location[]>("locations");

  const shift = shifts.data?.[0];
  const openJobs = (jobs.data ?? []).filter((j) => j.status === "booked" || j.status === "in_progress");
  const doneToday = (jobs.data ?? []).filter((j) => j.status === "completed");
  const bonusSoFar = doneToday.reduce((sum, j) => sum + j.bonus_mnt, 0);

  return (
    <MobileShell
      // formatDay, not toLocaleDateString("mn-MN") — see lib/utils.ts on
      // why asking Intl for Mongolian words is not reliable across browsers.
      subtitle={formatDay(new Date().toISOString())}
      title="Өнөөдөр"
      nav={employeeNav}
      action={<SignOutButton compact />}
      name={name}
      email={email}
    >
      <div className="flex flex-col gap-5">
        {current.error ? (
          <ErrorState message={current.error} onRetry={current.refresh} />
        ) : current.loading && current.data === undefined ? (
          <LoadingState label="Ирц шалгаж байна" />
        ) : (
          <>
            {shift ? (
              <p className="text-[13px] text-muted-foreground">
                Таны ээлж:{" "}
                <strong className="font-mono text-foreground">{formatRange(shift.start_at, shift.end_at)}</strong>,{" "}
                {shift.location.name}
              </p>
            ) : (
              <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground">
                Өнөөдөр таны хуваарь алга. Менежер орлуулж ажиллахыг хүссэн бол ирц бүртгүүлж болно.
              </p>
            )}

            <ClockCard
              current={current.data ?? null}
              shifts={shifts.data ?? []}
              locations={locations.data ?? []}
              onChanged={() => {
                current.refresh();
                jobs.refresh();
              }}
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col gap-1 pt-5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Дууссан</span>
              <span className="text-2xl font-bold tabular-nums">
                {doneToday.length} / {jobs.data?.length ?? 0}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 pt-5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Одоогийн урамшуулал
              </span>
              <span className="text-2xl font-bold tabular-nums">{formatMNT(bonusSoFar)}</span>
            </CardContent>
          </Card>
        </div>

        {openJobs.length > 0 && (
          <Link href="/employee/jobs" className="block">
            <Card className="border-primary/30 bg-accent">
              <CardContent className="flex items-center gap-3 pt-5">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-accent-foreground">
                    Дараагийн ажил
                  </span>
                  <span className="text-sm font-semibold text-accent-foreground">
                    {formatTime(openJobs[0].start_at)} · {openJobs[0].car.plate}
                  </span>
                  <span className="text-[13px] text-accent-foreground">{openJobs[0].service.name}</span>
                </div>
                <span aria-hidden className="text-accent-foreground">
                  →
                </span>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </MobileShell>
  );
}
