"use client";

import { useState } from "react";

import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import { DataState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Location, StaffWashService } from "@/lib/api/types";
import { formatDistance, formatMNT } from "@/lib/utils";

export function CatalogueScreen() {
  const services = useApi<StaffWashService[]>("manager/services");
  const locations = useApi<Location[]>("manager/locations");

  return (
    <>
      <PageHeader
        title="Prices & sites"
        description="Changing a price never touches a booking already taken — each one stored what it was sold for."
      />

      <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_26rem]">
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price list</h2>
          <DataState query={services} isEmpty={(rows) => rows.length === 0} empty={{ title: "No services yet" }}>
            {(rows) => (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Mins</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Bonus</TableHead>
                      <TableHead className="text-right">Live</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((service) => (
                      <TableRow key={service.id} className={service.active ? undefined : "text-muted-foreground"}>
                        <TableCell className="font-semibold">
                          {service.name}
                          {service.description && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {service.description}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{service.duration_min}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMNT(service.price_mnt)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMNT(service.bonus_mnt)}</TableCell>
                        <TableCell className="text-right">
                          <ToggleService service={service} onChanged={services.refresh} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataState>

          <AddServiceForm onAdded={services.refresh} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sites</h2>
          <DataState query={locations} isEmpty={(rows) => rows.length === 0} empty={{ title: "No sites yet" }}>
            {(rows) => (
              <div className="flex flex-col gap-3">
                {rows.map((location) => (
                  <SiteCard key={location.id} location={location} onChanged={locations.refresh} />
                ))}
              </div>
            )}
          </DataState>
        </section>
      </div>
    </>
  );
}

function ToggleService({ service, onChanged }: { service: StaffWashService; onChanged: () => void }) {
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await api.put(`manager/services/${service.id}`, { active: !service.active });
      toast.success(service.active ? "Withdrawn" : "Back on the list", {
        description: service.active
          ? "It leaves the customer app immediately; past bookings are untouched."
          : "Customers can book it again.",
      });
      onChanged();
    } catch (err) {
      toast.error("Could not change that", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={toggle} className="h-7 px-2">
      <Badge tone={service.active ? "active" : "neutral"}>{service.active ? "On" : "Off"}</Badge>
    </Button>
  );
}

function AddServiceForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [bonus, setBonus] = useState("");
  const [pending, setPending] = useState(false);

  async function add() {
    setPending(true);
    try {
      await api.post("manager/services", {
        name,
        duration_min: Number(duration),
        price_mnt: Number(price),
        bonus_mnt: Number(bonus),
        active: true,
      });
      toast.success("Service added");
      setName("");
      setPrice("");
      setBonus("");
      onAdded();
    } catch (err) {
      // 422 when the bonus exceeds the price — almost always a missing or
      // extra zero, which is exactly the typo worth catching before payroll.
      toast.error("Could not add the service", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add a service</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-[1fr_5rem_7rem_7rem_auto] sm:items-end">
        <Field id="svc-name" label="Name">
          <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="svc-mins" label="Mins">
          <Input id="svc-mins" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        <Field id="svc-price" label="Price ₮">
          <Input id="svc-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field id="svc-bonus" label="Bonus ₮">
          <Input id="svc-bonus" type="number" min={0} value={bonus} onChange={(e) => setBonus(e.target.value)} />
        </Field>
        <Button onClick={add} disabled={pending || !name || !price}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SiteCard({ location, onChanged }: { location: Location; onChanged: () => void }) {
  const [radius, setRadius] = useState(String(location.geofence_radius_m));
  const [pending, setPending] = useState(false);
  const changed = Number(radius) !== location.geofence_radius_m;

  async function save() {
    setPending(true);
    try {
      await api.put(`manager/locations/${location.id}`, { geofence_radius_m: Number(radius) });
      toast.success("Radius saved", { description: `Clock-in now allowed within ${radius} m.` });
      onChanged();
    } catch (err) {
      // 422 below 25 m or above 1000 m. The floor exists because consumer GPS
      // is routinely 10–20 m out, so a tighter fence fails honest staff.
      toast.error("Could not save the radius", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-baseline gap-2">
        <CardTitle className="flex-1 text-sm">{location.name}</CardTitle>
        <Badge tone={location.active ? "active" : "neutral"}>{location.active ? "Open" : "Closed"}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {location.address && <p className="text-[13px] text-muted-foreground">{location.address}</p>}
        <p className="font-mono text-[11px] text-muted-foreground">
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>

        <Field
          id={`radius-${location.id}`}
          label={`Clock-in radius — ${formatDistance(Number(radius))}`}
          hint="Between 25 m and 1 000 m. Tighter than 25 m fails honest staff on GPS drift."
        >
          <input
            id={`radius-${location.id}`}
            type="range"
            min={25}
            max={1000}
            step={5}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="h-11 w-full accent-[var(--primary)]"
          />
        </Field>

        {changed && (
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save radius"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
