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
        title="Үнэ, байршил"
        description="Үнэ өөрчлөгдсөн ч аль хэдийн хийгдсэн захиалгад нөлөөлөхгүй — тэдгээр нь зарагдсан үедээ хадгалагдсан."
      />

      <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_26rem]">
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Үнийн жагсаалт</h2>
          <DataState
            query={services}
            isEmpty={(rows) => rows.length === 0}
            empty={{ title: "Одоогоор үйлчилгээ алга" }}
          >
            {(rows) => (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Үйлчилгээ</TableHead>
                      <TableHead className="text-right">Мин</TableHead>
                      <TableHead className="text-right">Үнэ</TableHead>
                      <TableHead className="text-right">Урамшуулал</TableHead>
                      <TableHead className="text-right">Идэвхтэй</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((service) => (
                      <ServiceRow key={service.id} service={service} onChanged={services.refresh} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataState>

          <AddServiceForm onAdded={services.refresh} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Байршлууд</h2>
          <DataState query={locations} isEmpty={(rows) => rows.length === 0} empty={{ title: "Одоогоор байршил алга" }}>
            {(rows) => (
              <div className="flex flex-col gap-3">
                {rows.map((location) => (
                  <SiteCard key={location.id} location={location} onChanged={locations.refresh} />
                ))}
              </div>
            )}
          </DataState>

          <AddLocationForm onAdded={locations.refresh} />
        </section>
      </div>
    </>
  );
}

/**
 * One row in the price list, with the two things a manager does to it: turn
 * it off, or change what it says.
 *
 * Editing swaps the whole row for a single wide cell holding the form,
 * rather than opening a panel elsewhere on the page — the same choice the
 * gallery screen makes for a photograph, and for the same reason: the row
 * being edited is the row you were just looking at, and a form that appears
 * somewhere else is a second place to look.
 */
function ServiceRow({ service, onChanged }: { service: StaffWashService; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="bg-muted/30">
          <EditServiceForm
            service={service}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              onChanged();
            }}
          />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className={service.active ? undefined : "text-muted-foreground"}>
      <TableCell className="font-semibold">
        {service.name}
        {service.description && (
          <span className="block text-xs font-normal text-muted-foreground">{service.description}</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{service.duration_min}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMNT(service.price_mnt)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMNT(service.bonus_mnt)}</TableCell>
      <TableCell className="text-right">
        <ToggleService service={service} onChanged={onChanged} />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditing(true)}>
          Засах
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ToggleService({ service, onChanged }: { service: StaffWashService; onChanged: () => void }) {
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await api.put(`manager/services/${service.id}`, { active: !service.active });
      toast.success(service.active ? "Хасагдлаа" : "Жагсаалтад буцаж орлоо", {
        description: service.active
          ? "Харилцагчийн апп-аас шууд хасагдана; өмнөх захиалгад нөлөөлөхгүй."
          : "Харилцагчид дахин захиалах боломжтой боллоо.",
      });
      onChanged();
    } catch (err) {
      toast.error("Өөрчилж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={toggle} className="h-7 px-2">
      <Badge tone={service.active ? "active" : "neutral"}>{service.active ? "Асаалттай" : "Унтраалттай"}</Badge>
    </Button>
  );
}

/**
 * Changes a service's own details.
 *
 * Every field here is sent together on save, but the API treats an empty
 * string or a zero number as "leave this alone" rather than "clear it" — see
 * UpdateWashService on the backend. That is why the fields are prefilled
 * with the current values rather than left blank: a blank Name field
 * submitted as "" would silently keep the OLD name, which reads as the form
 * having done nothing, when what actually happened is a field that cannot
 * be cleared through this endpoint at all.
 */
function EditServiceForm({
  service,
  onSaved,
  onCancel,
}: {
  service: StaffWashService;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? "");
  const [duration, setDuration] = useState(String(service.duration_min));
  const [price, setPrice] = useState(String(service.price_mnt));
  const [bonus, setBonus] = useState(String(service.bonus_mnt));
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      await api.put(`manager/services/${service.id}`, {
        name,
        description,
        duration_min: Number(duration),
        price_mnt: Number(price),
        bonus_mnt: Number(bonus),
      });
      toast.success("Хадгалагдлаа", {
        description: "Энэ цагаас хойш захиалагдах угаалганд шинэ үнэ, урамшуулал хэрэгжинэ.",
      });
      onSaved();
    } catch (err) {
      // 422 when the bonus exceeds the price — the same typo guard as adding
      // a new one.
      toast.error("Хадгалж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  const id = `edit-svc-${service.id}`;

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Нэр">
          <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id={`${id}-desc`} label="Тайлбар" hint="Хоосон орхивол өмнөх тайлбар хэвээр үлдэнэ.">
          <Input id={`${id}-desc`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id={`${id}-mins`} label="Мин">
          <Input
            id={`${id}-mins`}
            type="number"
            min={1}
            max={480}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </Field>
        <Field id={`${id}-price`} label="Үнэ ₮">
          <Input id={`${id}-price`} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field id={`${id}-bonus`} label="Урамшуулал ₮">
          <Input id={`${id}-bonus`} type="number" min={0} value={bonus} onChange={(e) => setBonus(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending || !name.trim() || !price}>
          {pending ? "Хадгалж байна…" : "Хадгалах"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onCancel}>
          Цуцлах
        </Button>
      </div>
    </div>
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
      toast.success("Үйлчилгээ нэмэгдлээ");
      setName("");
      setPrice("");
      setBonus("");
      onAdded();
    } catch (err) {
      // 422 when the bonus exceeds the price — almost always a missing or
      // extra zero, which is exactly the typo worth catching before payroll.
      toast.error("Үйлчилгээ нэмж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Үйлчилгээ нэмэх</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-[1fr_5rem_7rem_7rem_auto] sm:items-end">
        <Field id="svc-name" label="Нэр">
          <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="svc-mins" label="Мин">
          <Input id="svc-mins" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        <Field id="svc-price" label="Үнэ ₮">
          <Input id="svc-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field id="svc-bonus" label="Урамшуулал ₮">
          <Input id="svc-bonus" type="number" min={0} value={bonus} onChange={(e) => setBonus(e.target.value)} />
        </Field>
        <Button onClick={add} disabled={pending || !name || !price}>
          {pending ? "Нэмж байна…" : "Нэмэх"}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * One site: its identity, whether it is open, and the geofence.
 *
 * Two different editing shapes on purpose. The radius is a slider that is
 * always live — it is the field a manager tunes repeatedly after watching a
 * few honest clock-ins get refused, and hiding it behind an Edit click would
 * cost a click every time for the one field used the most. Name, address and
 * open/closed change rarely, so they stay read-only text until asked for,
 * the same swap-in-place pattern the price list and the gallery both use.
 */
function SiteCard({ location, onChanged }: { location: Location; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [radius, setRadius] = useState(String(location.geofence_radius_m));
  const [pending, setPending] = useState(false);
  const changed = Number(radius) !== location.geofence_radius_m;

  async function saveRadius() {
    setPending(true);
    try {
      await api.put(`manager/locations/${location.id}`, { geofence_radius_m: Number(radius) });
      toast.success("Радиус хадгалагдлаа", { description: `Ирц одоо ${radius} м дотор бүртгэгдэнэ.` });
      onChanged();
    } catch (err) {
      // 422 below 25 m or above 1000 m. The floor exists because consumer GPS
      // is routinely 10–20 m out, so a tighter fence fails honest staff.
      toast.error("Радиус хадгалж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  async function toggleActive() {
    setPending(true);
    try {
      await api.put(`manager/locations/${location.id}`, { active: !location.active });
      toast.success(location.active ? "Хаагдлаа" : "Нээгдлээ", {
        description: location.active
          ? "Энэ байршилд шинэ ирц, захиалга авахгүй."
          : "Энэ байршилд дахин ирц, захиалга авах боломжтой боллоо.",
      });
      onChanged();
    } catch (err) {
      toast.error("Өөрчилж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-baseline gap-2">
        {editing ? (
          <CardTitle className="flex-1 text-sm">Байршлыг засах</CardTitle>
        ) : (
          <>
            <CardTitle className="flex-1 text-sm">{location.name}</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 px-1.5" disabled={pending} onClick={toggleActive}>
              <Badge tone={location.active ? "active" : "neutral"}>{location.active ? "Нээлттэй" : "Хаалттай"}</Badge>
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => setEditing(true)}>
              Засах
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <EditSiteForm
            location={location}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              onChanged();
            }}
          />
        ) : (
          <>
            {location.address && <p className="text-[13px] text-muted-foreground">{location.address}</p>}
            <p className="font-mono text-[11px] text-muted-foreground">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </>
        )}

        <Field
          id={`radius-${location.id}`}
          label={`Ирцийн радиус — ${formatDistance(Number(radius))}`}
          hint="25 м-ээс 1000 м хооронд байх ёстой. 25 м-ээс жижиг бол GPS-ийн алдаанаас болж шударга ажилтныг ч татгалзана."
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
          <Button size="sm" onClick={saveRadius} disabled={pending}>
            {pending ? "Хадгалж байна…" : "Радиус хадгалах"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Name and address. Not the coordinates — those are shown but not editable
 * here, because a wrong pair typed by hand is the one mistake that would
 * silently move the geofence to a different part of the city, and this app
 * has no map to catch that by eye before it is saved. Re-adding the site
 * with the right coordinates is the safer path if they were wrong from the
 * start.
 */
function EditSiteForm({
  location,
  onSaved,
  onCancel,
}: {
  location: Location;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address ?? "");
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      await api.put(`manager/locations/${location.id}`, { name, address });
      toast.success("Хадгалагдлаа");
      onSaved();
    } catch (err) {
      toast.error("Хадгалж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  const id = `edit-site-${location.id}`;

  return (
    <div className="flex flex-col gap-3">
      <Field id={`${id}-name`} label="Нэр">
        <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field id={`${id}-address`} label="Хаяг" hint="Хоосон орхивол өмнөх хаяг хэвээр үлдэнэ.">
        <Input id={`${id}-address`} value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending || !name.trim()}>
          {pending ? "Хадгалж байна…" : "Хадгалах"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onCancel}>
          Цуцлах
        </Button>
      </div>
    </div>
  );
}

/**
 * A new site. Latitude and longitude are typed in as plain numbers rather
 * than picked on a map — there is no map anywhere in this app, and adding
 * one for a form used a few times a year would be a dependency the rest of
 * the product does not otherwise need. Get the pair from any map app's
 * "copy coordinates" and paste both here.
 */
function AddLocationForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("100");
  const [pending, setPending] = useState(false);

  async function add() {
    setPending(true);
    try {
      await api.post("manager/locations", {
        name,
        address,
        lat: Number(lat),
        lng: Number(lng),
        geofence_radius_m: Number(radius),
        active: true,
      });
      toast.success("Байршил нэмэгдлээ");
      setName("");
      setAddress("");
      setLat("");
      setLng("");
      onAdded();
    } catch (err) {
      // 422 for a coordinate outside real lat/lng bounds, or a radius outside
      // 25–1000 m — both are typos worth catching before an employee's first
      // clock-in there is refused for no reason they can see.
      toast.error("Байршил нэмж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Байршил нэмэх</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field id="loc-name" label="Нэр">
          <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="loc-address" label="Хаяг" hint="Заавал биш.">
          <Input id="loc-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="loc-lat" label="Өргөрөг (lat)">
            <Input id="loc-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
          </Field>
          <Field id="loc-lng" label="Уртраг (lng)">
            <Input id="loc-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
          </Field>
        </div>
        <Field id="loc-radius" label="Ирцийн радиус (м)" hint="25-с 1000 хооронд.">
          <Input
            id="loc-radius"
            type="number"
            min={25}
            max={1000}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </Field>
        <Button onClick={add} disabled={pending || !name.trim() || !lat || !lng}>
          {pending ? "Нэмж байна…" : "Нэмэх"}
        </Button>
      </CardContent>
    </Card>
  );
}
