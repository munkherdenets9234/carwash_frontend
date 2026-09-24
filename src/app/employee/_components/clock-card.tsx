"use client";

import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { api, errorMessage, hasCode } from "@/lib/api/client";
import { ErrorCode, type Location, type Readiness, type Shift, type TimeEntry } from "@/lib/api/types";
import { formatDistance, formatTime } from "@/lib/utils";

type Fix = { lat: number; lng: number; accuracy: number };

/** Metres between two WGS-84 points. Mirrors pkg/geo on the backend so the
 * screen can show the distance BEFORE asking, rather than only reporting the
 * refusal after. The server's answer is still the authority. */
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371008.8;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function ClockCard({
  current,
  shifts,
  locations,
  onChanged,
}: {
  current: TimeEntry | null | undefined;
  shifts: Shift[];
  locations: Location[];
  onChanged: () => void;
}) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [geoError, setGeoError] = useState<string | undefined>();
  const [locating, setLocating] = useState(false);
  const [pending, setPending] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [siteId, setSiteId] = useState("");

  // Today's shift decides the default site — it is where this person is
  // actually rostered, not where they usually work.
  const todayShift = shifts[0];
  const site = locations.find((l) => l.id === (siteId || todayShift?.location.id)) ?? locations[0];

  useEffect(() => {
    // The demo shortcut below is offered only when the API says this is not
    // production. Asked of the server rather than inferred from the hostname,
    // so a staging build cannot accidentally ship it.
    fetch("/api/readyz")
      .then((r) => r.json())
      .then((r: Readiness) => setDevMode(r.env !== "production"))
      .catch(() => setDevMode(false));
  }, []);

  function locate() {
    if (!navigator.geolocation) {
      setGeoError("This browser cannot report a location.");
      return;
    }
    setLocating(true);
    setGeoError(undefined);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was refused. Clock-in needs it."
            : "No GPS fix yet. Step outside and try again.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  const distance = fix && site ? distanceM(fix.lat, fix.lng, site.lat, site.lng) : undefined;
  const withinFence = distance !== undefined && site ? distance <= site.geofence_radius_m : false;

  async function clockIn() {
    if (!fix || !site) return;
    setPending(true);
    try {
      await api.post<TimeEntry>("employee/attendance/clock-in", {
        location_id: site.id,
        lat: fix.lat,
        lng: fix.lng,
      });
      toast.success("Clocked in", { description: `At ${site.name}.` });
      onChanged();
    } catch (err) {
      // OUTSIDE_GEOFENCE carries the measured distance in its message, which
      // is more useful than anything this screen could say, so it is shown
      // as-is rather than replaced.
      if (hasCode(err, ErrorCode.OutsideGeofence)) {
        toast.error("Too far from the site", { description: errorMessage(err) });
      } else {
        toast.error("Could not clock in", { description: errorMessage(err) });
      }
    } finally {
      setPending(false);
    }
  }

  async function clockOut() {
    setPending(true);
    try {
      // Coordinates are sent when available and simply omitted when not:
      // clock-out is never refused for being far away, so a missing fix must
      // not block someone from ending their shift.
      await api.post<TimeEntry>("employee/attendance/clock-out", {
        lat: fix?.lat ?? 0,
        lng: fix?.lng ?? 0,
      });
      toast.success("Clocked out", { description: "Your hours are on today's timesheet." });
      onChanged();
    } catch (err) {
      toast.error("Could not clock out", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  if (current) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="flex items-center gap-2.5 rounded-md border border-primary/30 bg-accent px-3 py-2.5">
            <CheckCircle2 aria-hidden className="size-4 text-accent-foreground" />
            <span className="flex-1 text-[13px] text-accent-foreground">
              Clocked in at <strong>{formatTime(current.clock_in_at)}</strong> · {current.location.name}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Recorded {formatDistance(current.clock_in_distance_m)} from the site.
          </p>
          <Button variant="outline" size="lg" onClick={clockOut} disabled={pending}>
            {pending ? "Clocking out…" : "Clock out"}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Clocking out is never refused for being away from the site — the distance is recorded instead, so nobody
            stays on the clock after going home.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        {locations.length > 1 && (
          <Select
            aria-label="Site"
            value={site?.id ?? ""}
            onChange={(e) => {
              setSiteId(e.target.value);
              setFix(null);
            }}
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        )}

        {site && (
          <div className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              {site.name} · clock-in allowed within {formatDistance(site.geofence_radius_m)}
            </span>
          </div>
        )}

        {!fix && (
          <Button size="lg" onClick={locate} disabled={locating}>
            {locating ? "Finding you…" : "Check my location"}
          </Button>
        )}

        {geoError && (
          <p role="alert" className="flex items-start gap-2 text-[13px] text-destructive">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            {geoError}
          </p>
        )}

        {fix && site && (
          <>
            <div
              className={
                withinFence
                  ? "flex items-center gap-2.5 rounded-md border border-primary/30 bg-accent px-3 py-2.5"
                  : "flex items-center gap-2.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5"
              }
            >
              {withinFence ? (
                <CheckCircle2 aria-hidden className="size-4 text-accent-foreground" />
              ) : (
                <AlertTriangle aria-hidden className="size-4 text-warning" />
              )}
              <span className={withinFence ? "text-[13px] text-accent-foreground" : "text-[13px] text-warning"}>
                You are <strong>{formatDistance(distance)}</strong> from the site
                {withinFence ? "" : ` — clock-in needs ${formatDistance(site.geofence_radius_m)}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your phone reports this fix as ±{Math.round(fix.accuracy)} m.
            </p>

            <div className="flex gap-2">
              <Button className="flex-1" size="lg" onClick={clockIn} disabled={pending}>
                {pending ? "Clocking in…" : "Clock in"}
              </Button>
              <Button variant="outline" size="lg" onClick={locate} disabled={locating}>
                Recheck
              </Button>
            </div>
          </>
        )}

        {devMode && site && (
          <button
            type="button"
            onClick={() => setFix({ lat: site.lat, lng: site.lng, accuracy: 5 })}
            className="rounded-md border border-dashed border-border px-3 py-2.5 font-mono text-[11px] text-muted-foreground"
          >
            Demo only: pretend I am standing at {site.name}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
