"use client";

import { Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MobileShell } from "@/components/app/mobile-shell";
import { DataState } from "@/components/app/states";
import { ReservationBadge } from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { ReservationStatus, StaffReservation } from "@/lib/api/types";
import { businessToday, formatMNT, formatRange } from "@/lib/utils";
import { employeeNav } from "@/navigation/sidebar-items";

export function JobsScreen({ name, email }: { name?: string; email?: string }) {
  const today = businessToday();
  const jobs = useApi<StaffReservation[]>("employee/jobs", { from: today, to: today });

  return (
    <MobileShell title="Өнөөдрийн ажлууд" nav={employeeNav} name={name} email={email}>
      <DataState
        query={jobs}
        isEmpty={(rows) => rows.length === 0}
        empty={{ title: "Өнөөдөр ажил алга", description: "Харилцагчийн захиалгууд энд харагдана." }}
      >
        {(rows) => (
          <ul className="flex flex-col gap-3">
            {rows.map((job) => (
              <li key={job.id}>
                <JobCard job={job} onChanged={jobs.refresh} />
              </li>
            ))}
          </ul>
        )}
      </DataState>
    </MobileShell>
  );
}

/**
 * One job, expandable.
 *
 * The wireframe drew a separate detail screen; this is a card that opens in
 * place instead, because the API has no single-job endpoint for an employee —
 * a detail route would have to re-fetch the whole day and pick one row out of
 * it. Expanding avoids a round trip and a back-navigation for information
 * that is three lines long.
 */
function JobCard({ job, onChanged }: { job: StaffReservation; onChanged: () => void }) {
  const [open, setOpen] = useState(job.status === "in_progress");
  const [pending, setPending] = useState<ReservationStatus | null>(null);

  const live = job.status === "booked" || job.status === "in_progress";

  async function move(status: ReservationStatus, message: string) {
    setPending(status);
    try {
      await api.put(`employee/jobs/${job.id}/status`, { status });
      toast.success(
        message,
        status === "completed" ? { description: `${formatMNT(job.bonus_mnt)} таных боллоо.` } : undefined,
      );
      onChanged();
    } catch (err) {
      toast.error("Ажлыг шинэчилж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className={job.status === "in_progress" ? "border-warning/40" : undefined}>
      <CardContent className="flex flex-col gap-3 pt-5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-start gap-3 text-left"
        >
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-sm">{formatRange(job.start_at, job.end_at)}</span>
            <span className="font-mono text-[15px] font-medium">{job.car.plate}</span>
            <span className="text-[13px] text-muted-foreground">
              {job.service.name} · {[job.car.make, job.car.model].filter(Boolean).join(" ") || "—"}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <ReservationBadge status={job.status} />
            <span className="text-sm font-bold tabular-nums">+{formatMNT(job.bonus_mnt)}</span>
          </div>
        </button>

        {open && (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[13px] font-semibold">{job.customer.name ?? "Харилцагч"}</span>
                {job.customer.phone && (
                  <span className="font-mono text-[13px] text-muted-foreground">{job.customer.phone}</span>
                )}
              </div>
              {job.customer.phone && (
                // An <a href="tel:"> styled as a button, not a <button> with a
                // link inside it: the latter nests interactive elements, which
                // breaks keyboard activation and is invalid HTML.
                <a
                  href={`tel:${job.customer.phone.replace(/\s/g, "")}`}
                  aria-label={`${job.customer.name ?? "харилцагч"} руу залгах`}
                  className={buttonVariants({ variant: "outline", size: "icon" })}
                >
                  <Phone aria-hidden />
                </a>
              )}
            </div>

            {job.notes && (
              <p className="rounded-md border border-border bg-muted px-3 py-2.5 text-[13px]">{job.notes}</p>
            )}

            <div className="flex items-baseline gap-3 rounded-md border border-border bg-muted px-3 py-2.5">
              <span className="flex-1 text-[13px] text-muted-foreground">Харилцагчийн төлөх дүн</span>
              <span className="text-sm font-bold tabular-nums">{formatMNT(job.price_mnt)}</span>
            </div>

            {live ? (
              <div className="flex flex-col gap-2">
                {job.status === "booked" && (
                  <Button size="lg" onClick={() => move("in_progress", "Эхэллээ")} disabled={pending !== null}>
                    {pending === "in_progress" ? "Эхэлж байна…" : "Угаалгыг эхлүүлэх"}
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    variant={job.status === "in_progress" ? "default" : "outline"}
                    size="lg"
                    className="flex-1"
                    onClick={() => move("completed", "Дууслаа")}
                    disabled={pending !== null}
                  >
                    {pending === "completed" ? "Хадгалж байна…" : "Дуусгах"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="flex-1"
                    onClick={() => move("no_show", "Ирээгүй гэж тэмдэглэлээ")}
                    disabled={pending !== null}
                  >
                    Ирээгүй
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Дуусгасны дараа {formatMNT(job.bonus_mnt)} таны өнөөдрийн тайланд орно. Дараа нь дахин нээх боломжгүй.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Энэ ажил хаагдсан байна. Дууссан захиалгыг зөвхөн менежер өөрчлөх боломжтой.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
