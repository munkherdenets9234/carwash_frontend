"use client";

import { useState } from "react";

import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import { DataState } from "@/components/app/states";
import { UserBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Location, Role, StaffMember, UserStatus } from "@/lib/api/types";

// Every ROLE this table can show, not only the one it used to special-case.
// {person.role} alone would leak the raw wire value ("manager", "customer")
// for the two rows the old code did not name — the same class of bug as an
// unlabelled status enum, just on a field nobody had tried the other tab to
// notice.
const ROLE_LABEL: Record<Role, string> = {
  employee: "Ажилтан",
  manager: "Менежер",
  customer: "Харилцагч",
};

export function StaffScreen() {
  const staff = useApi<StaffMember[]>("manager/staff");
  const customers = useApi<StaffMember[]>("manager/customers");
  const locations = useApi<Location[]>("manager/locations");
  const [tab, setTab] = useState<"staff" | "customers">("staff");

  const active = tab === "staff" ? staff : customers;

  return (
    <>
      <PageHeader
        title="Хүмүүс"
        actions={
          <div role="tablist" aria-label="Ямар хүмүүс" className="flex gap-1.5">
            <Button
              role="tab"
              aria-selected={tab === "staff"}
              variant={tab === "staff" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("staff")}
            >
              Ажилтнууд
            </Button>
            <Button
              role="tab"
              aria-selected={tab === "customers"}
              variant={tab === "customers" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("customers")}
            >
              Харилцагчид
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 p-6 sm:p-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <DataState query={active} isEmpty={(rows) => rows.length === 0} empty={{ title: "Одоогоор хэн ч алга" }}>
            {(rows) => (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Нэр</TableHead>
                      <TableHead>Эрх</TableHead>
                      <TableHead>Холбоо барих</TableHead>
                      <TableHead>Төлөв</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-semibold">{person.name}</TableCell>
                        <TableCell>
                          <Badge>{ROLE_LABEL[person.role]}</Badge>
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">
                          <span className="block">{person.email}</span>
                          {person.phone && <span className="block font-mono">{person.phone}</span>}
                        </TableCell>
                        <TableCell>
                          <UserBadge status={person.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusButton person={person} onChanged={active.refresh} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataState>
        </div>

        {tab === "staff" && <AddStaffPanel locations={locations.data ?? []} onAdded={staff.refresh} />}
      </div>
    </>
  );
}

function StatusButton({ person, onChanged }: { person: StaffMember; onChanged: () => void }) {
  const [pending, setPending] = useState(false);
  const next: UserStatus = person.status === "active" ? "suspended" : "active";

  async function change() {
    setPending(true);
    try {
      await api.put(`manager/staff/${person.id}/status`, { status: next });
      toast.success(next === "suspended" ? "Түдгэлзүүллээ" : "Сэргээлээ", {
        description:
          next === "suspended"
            ? "Тэдний одоогийн нэвтрэлт дараагийн хүсэлтээс ажиллахгүй болно."
            : `${person.name} дахин нэвтрэх боломжтой боллоо.`,
      });
      onChanged();
    } catch (err) {
      // The API refuses a manager suspending themselves (422). Its message
      // explains why, so it is passed through.
      toast.error("Өөрчилж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={change}>
      {next === "suspended" ? "Түдгэлзүүлэх" : "Сэргээх"}
    </Button>
  );
}

function AddStaffPanel({ locations, onAdded }: { locations: Location[]; onAdded: () => void }) {
  const [role, setRole] = useState<Exclude<Role, "customer">>("employee");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [locationId, setLocationId] = useState("");
  const [pending, setPending] = useState(false);

  const site = locationId || locations[0]?.id || "";

  async function create() {
    setPending(true);
    try {
      await api.post("manager/staff", {
        role,
        name,
        email,
        phone,
        password,
        home_location_id: role === "employee" ? site : undefined,
      });
      toast.success("Бүртгэл үүслээ", { description: `${name} одоо нэвтрэх боломжтой.` });
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      onAdded();
    } catch (err) {
      toast.error("Бүртгэл үүсгэж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="h-fit w-full shrink-0 xl:w-80">
      <CardHeader>
        <CardTitle>Хүн нэмэх</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field id="staff-role" label="Эрх">
          <Select id="staff-role" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, "customer">)}>
            <option value="employee">Ажилтан</option>
            <option value="manager">Менежер</option>
          </Select>
        </Field>

        <Field id="staff-name" label="Нэр">
          <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>

        <Field id="staff-email" label="Имэйл">
          <Input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
        </Field>

        <Field id="staff-phone" label="Утас">
          <Input id="staff-phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
        </Field>

        <Field id="staff-password" label="Түр нууц үг" hint="Хамгийн багадаа 8 тэмдэгт.">
          <Input
            id="staff-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        {role === "employee" && (
          <Field id="staff-site" label="Байнгын ажлын байршил">
            <Select id="staff-site" value={site} onChange={(e) => setLocationId(e.target.value)}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Button onClick={create} disabled={pending || !name || !email || password.length < 8}>
          {pending ? "Үүсгэж байна…" : "Бүртгэл үүсгэх"}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Энд зөвхөн ажилтан, менежер бүртгэгддэг. Харилцагчид өөрсдөө бүртгүүлдэг — өөр хүний сонгосон нууц үгтэй
          бүртгэл тэдний зөвшөөрсөн зүйл биш юм.
        </p>
      </CardContent>
    </Card>
  );
}
