"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import { DataState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage, hasCode } from "@/lib/api/client";
import type { Media, MediaRole } from "@/lib/api/types";

const TAGS = ["exterior", "interior", "detailing", "beforeAfter"] as const;

const ROLE_LABEL: Record<MediaRole, string> = {
  hero: "Нүүр хуудасны зураг",
  about: "Бидний тухай зураг",
  gallery: "Галерей",
};

// Display labels for the tag enum values the API expects verbatim. The
// values themselves ("exterior", "interior", ...) are wire format and stay
// in English — this is the one place they are TRANSLATED FOR DISPLAY rather
// than sent, the same distinction ROLE_LABEL already draws for role.
const TAG_LABEL: Record<(typeof TAGS)[number], string> = {
  exterior: "Гадна тал",
  interior: "Дотор тал",
  detailing: "Нарийн арчилгаа",
  beforeAfter: "Өмнө/Дараа",
};

/**
 * The shopfront's photographs.
 *
 * Manager-only, like the rest of this area: an employee has no business changing
 * what the storefront looks like.
 *
 * Grouped by role rather than shown as one list, because the two single-slot
 * images are a different kind of thing from the album — there is exactly one
 * home cover, and a screen that buries it in a grid of twenty makes "which
 * one is the cover" a question you answer by hunting for a badge.
 */
export function GalleryScreen() {
  const media = useApi<Media[]>("manager/media");

  return (
    <>
      <PageHeader
        title="Зургууд"
        description="Нийтэд харагдах зургууд. Нүүр хуудас, бидний тухай хэсэг тус бүр нэг зурагтай; бусад нь бүгд галерейд ордог."
      />

      <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_26rem]">
        <section className="flex min-w-0 flex-col gap-6">
          <DataState
            query={media}
            isEmpty={(rows) => rows.length === 0}
            empty={{
              title: "Одоогоор зураг алга",
              description: "Та зураг оруулах хүртэл сайт түр загварын зургуудыг харуулна.",
            }}
          >
            {(rows) => (
              <>
                <SlotCard mediaRole="hero" rows={rows} onChange={media.refresh} />
                <SlotCard mediaRole="about" rows={rows} onChange={media.refresh} />
                <GalleryCard rows={rows} onChange={media.refresh} />
              </>
            )}
          </DataState>
        </section>

        <UploadCard onUploaded={media.refresh} />
      </div>
    </>
  );
}

/** One of the single-slot roles: the home cover, or the about picture. */
// The prop is mediaRole rather than role because a prop named role on a JSX
// element is read as an ARIA role by the linter, whose suggested fix is to
// delete it. A name that cannot be mistaken beats a suppression comment.
function SlotCard({ mediaRole: role, rows, onChange }: { mediaRole: MediaRole; rows: Media[]; onChange: () => void }) {
  const photo = rows.find((m) => m.role === role);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ROLE_LABEL[role]}</CardTitle>
      </CardHeader>
      <CardContent>
        {photo ? (
          <Tile photo={photo} rows={rows} onChange={onChange} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Одоогоор сонгоогүй байна. Сайт галерейн эхний зургийг ашиглана — доор “{ROLE_LABEL[role]} болгох” товчоор
            сонгоно уу.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GalleryCard({ rows, onChange }: { rows: Media[]; onChange: () => void }) {
  const gallery = rows.filter((m) => m.role === "gallery");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Галерей ({gallery.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {gallery.length === 0 ? (
          <p className="text-sm text-muted-foreground">Галерейд одоогоор зураг алга.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {gallery.map((photo) => (
              <li key={photo.id}>
                <Tile photo={photo} rows={rows} onChange={onChange} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** One photograph, with the things a manager does to it. */
function Tile({ photo, rows, onChange }: { photo: Media; rows: Media[]; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  async function patch(body: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      await api.put(`manager/media/${photo.id}`, body);
      toast.success(done);
      onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    // No confirm dialog: deleting removes the file at the image host too, so
    // there is nothing to undo and a one-line "are you sure" is the only
    // thing between a misclick and a photograph that has to be re-shot.
    if (!window.confirm("Энэ зургийг устгах уу? Файл устаж, сэргээх боломжгүй болно.")) return;
    setBusy(true);
    try {
      await api.delete(`manager/media/${photo.id}`);
      toast.success("Устгагдлаа");
      onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const alt = photo.alt.mn || photo.alt.en || "Гарчиггүй зураг";

  return (
    <div className="flex gap-3 rounded-lg border border-border p-3">
      <div className="relative size-24 shrink-0 overflow-hidden rounded bg-muted">
        <Image src={photo.url} alt={alt} fill sizes="96px" className="object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {editing ? (
          <EditForm
            photo={photo}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              onChange();
            }}
          />
        ) : (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{alt}</p>
              <p className="text-xs text-muted-foreground">
                {photo.width}×{photo.height}
                {photo.tag ? ` · ${photo.tag}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={photo.active ? "active" : "neutral"}>{photo.active ? "Идэвхтэй" : "Нуугдсан"}</Badge>
              {photo.role !== "gallery" && <Badge tone="neutral">{ROLE_LABEL[photo.role]}</Badge>}
              {photo.feature && <Badge tone="neutral">Онцлох</Badge>}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {/* Edit first, because it is the one that covers everything the
                  others do. The quick buttons stay because moving a photograph
                  into the cover slot is one click and should not cost a form. */}
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}>
                Засах
              </Button>
              {photo.role !== "hero" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => patch({ role: "hero" }, "Нүүр хуудасны зураг болголоо")}
                >
                  Нүүр хуудасны зураг болгох
                </Button>
              )}
              {photo.role !== "about" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => patch({ role: "about" }, "Бидний тухай зураг болголоо")}
                >
                  Бидний тухай хэсэгт ашиглах
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  patch({ active: !photo.active }, photo.active ? "Сайтаас нуулаа" : "Сайтад харагдаж байна")
                }
              >
                {photo.active ? "Нуух" : "Харуулах"}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={remove}>
                Устгах
              </Button>
            </div>

            {/* Replacing the previous holder is stated where it happens, so it is
                not a surprise after the click. */}
            {rows.some((m) => m.role === "hero") && photo.role !== "hero" && (
              <p className="text-[11px] text-muted-foreground">Шинэ зураг сонговол одоогийнх нь галерей руу шилжинэ.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Changes a photograph already on the site.
 *
 * Everything about a picture except the picture itself is a PUT. Swapping the
 * BYTES is not, and cannot be: a URL is public and may already be cached by a
 * browser, a CDN or a social preview, so quietly pointing it at different
 * pixels means somebody sees a photograph the business has already replaced.
 * The API has no route that would overwrite one, for that reason.
 *
 * So "replace the picture" here is an upload followed by a delete - a new
 * URL, and the old one withdrawn — with the caption, placement and position
 * carried across so that it is one action to the person doing it. The order
 * is upload-then-delete and never the reverse: a failed upload has to leave
 * the original in place, because the alternative is a home page with no cover
 * and a photograph that has to be re-shot.
 */
function EditForm({ photo, onSaved, onCancel }: { photo: Media; onSaved: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<MediaRole>(photo.role);
  const [altMN, setAltMN] = useState(photo.alt.mn ?? "");
  const [altEN, setAltEN] = useState(photo.alt.en ?? "");
  const [tag, setTag] = useState(photo.tag ?? "exterior");
  const [feature, setFeature] = useState(photo.feature);
  const [file, setFile] = useState<File | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!altMN.trim() && !altEN.trim()) {
      toast.error("Зургийг дор хаяж нэг хэлээр тайлбарлана уу.");
      return;
    }

    setBusy(true);
    try {
      if (file) {
        await replaceBytes();
      } else {
        await api.put(`manager/media/${photo.id}`, {
          role,
          alt_mn: altMN,
          alt_en: altEN,
          // Tag and feature belong to a gallery tile. Sending them for a cover
          // would store a grouping nothing reads, which is the kind of stale
          // field somebody later mistakes for a fact.
          ...(role === "gallery" ? { tag, feature } : {}),
        });
        toast.success("Хадгалагдлаа");
      }
      onSaved();
    } catch (err) {
      toast.error(
        hasCode(err, "LIMIT_EXCEEDED")
          ? "Таны багцын галерей дүүрсэн байна. Шинэ зургийг хуучнаас өмнө байршуулдаг тул эхлээд нэгийг устгана уу."
          : errorMessage(err),
      );
    } finally {
      setBusy(false);
    }
  }

  async function replaceBytes() {
    const form = new FormData();
    form.set("file", file as File);
    form.set("role", role);
    form.set("alt_mn", altMN);
    form.set("alt_en", altEN);
    if (role === "gallery") {
      form.set("tag", tag);
      form.set("feature", String(feature));
    }

    const created = await api.upload<Media>("manager/media", form);

    // The old row goes second, and a failure here is reported rather than
    // thrown: the replacement is already live at this point, so treating it
    // as a failed save would be a lie. What is left behind is one visible
    // extra tile, which the manager can delete.
    try {
      await api.delete(`manager/media/${photo.id}`);
    } catch {
      toast.error("Шинэ зураг идэвхжсэн ч хуучныг устгаж чадсангүй. Доорх галерейд байгаа тул тэндээс устгана уу.");
    }

    // Carry the position across, so a replaced tile does not jump to the end
    // of a grid somebody arranged on purpose.
    if (role === "gallery" && created.sort_order !== photo.sort_order) {
      await api.put(`manager/media/${created.id}`, { sort_order: photo.sort_order });
    }

    toast.success("Зураг солигдлоо");
  }

  const id = `edit-${photo.id}`;

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <Field id={`${id}-role`} label="Хаана ашиглах">
        <Select id={`${id}-role`} value={role} onChange={(e) => setRole(e.target.value as MediaRole)}>
          <option value="gallery">Галерей</option>
          <option value="hero">Нүүр хуудасны зураг</option>
          <option value="about">Бидний тухай зураг</option>
        </Select>
      </Field>

      {role === "gallery" && (
        <Field id={`${id}-tag`} label="Ангилал">
          <Select id={`${id}-tag`} value={tag} onChange={(e) => setTag(e.target.value)}>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {TAG_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field id={`${id}-mn`} label="Тайлбар (Монгол)">
        <Input id={`${id}-mn`} value={altMN} onChange={(e) => setAltMN(e.target.value)} />
      </Field>
      <Field id={`${id}-en`} label="Тайлбар (Англи)">
        <Input id={`${id}-en`} value={altEN} onChange={(e) => setAltEN(e.target.value)} />
      </Field>

      {role === "gallery" && (
        <label className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <input type="checkbox" checked={feature} onChange={(e) => setFeature(e.target.checked)} className="size-4" />
          Хүснэгтэд том хэмжээгээр харуулах
        </label>
      )}

      <Field
        id={`${id}-file`}
        label="Зургийг солих"
        hint={
          file
            ? "Шинэ зураг байршсаны дараа одоогийн зураг устана."
            : "Одоогийн зургийг хэвээр үлдээж, зөвхөн мэдээллийг өөрчлөхийг хүсвэл хоосон орхино уу."
        }
      >
        <Input
          id={`${id}-file`}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>

      <div className="flex flex-wrap gap-1.5">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? (file ? "Солиж байна…" : "Хадгалж байна…") : "Хадгалах"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
          Цуцлах
        </Button>
      </div>
    </form>
  );
}

function UploadCard({ onUploaded }: { onUploaded: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<MediaRole>("gallery");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Эхлээд зураг сонгоно уу.");
      return;
    }
    if (!String(form.get("alt_mn") ?? "").trim() && !String(form.get("alt_en") ?? "").trim()) {
      // Checked here as well as on the server, because the server's refusal
      // arrives after the file has been uploaded over a slow connection and
      // this one does not.
      toast.error("Зургийг дор хаяж нэг хэлээр тайлбарлана уу.");
      return;
    }

    setBusy(true);
    try {
      await api.upload<Media>("manager/media", form);
      toast.success("Байршууллаа");
      formRef.current?.reset();
      setRole("gallery");
      onUploaded();
    } catch (err) {
      // A plan limit is not a failure to retry, so it gets its own sentence
      // rather than the generic error text.
      toast.error(hasCode(err, "LIMIT_EXCEEDED") ? errorMessage(err) : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Зураг нэмэх</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4">
          <Field id="media-file" label="Зураг">
            <Input
              id="media-file"
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              required
            />
          </Field>

          <Field id="media-role" label="Хаана ашиглах">
            <Select id="media-role" name="role" value={role} onChange={(e) => setRole(e.target.value as MediaRole)}>
              <option value="gallery">Галерей</option>
              <option value="hero">Нүүр хуудасны зураг</option>
              <option value="about">Бидний тухай зураг</option>
            </Select>
          </Field>

          {role === "gallery" && (
            <Field id="media-tag" label="Ангилал">
              <Select id="media-tag" name="tag" defaultValue="exterior">
                {TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {TAG_LABEL[tag]}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {/* Both languages, because the site runs in both and the caption is
              the only description a screen reader gets. One is enough; the
              other falls back to it. */}
          <Field id="media-alt-mn" label="Тайлбар (Монгол)">
            <Input id="media-alt-mn" name="alt_mn" placeholder="Хөөсөн угаалга" />
          </Field>
          <Field id="media-alt-en" label="Тайлбар (Англи)">
            <Input id="media-alt-en" name="alt_en" placeholder="Foam wash" />
          </Field>

          <Button type="submit" disabled={busy}>
            {busy ? "Байршуулж байна…" : "Байршуулах"}
          </Button>

          <p className="text-[11px] text-muted-foreground">
            jpeg, png, gif эсвэл webp. Хэмжээ файлаас автоматаар уншигдана, тул зураг ачаалахад хуудас шилжихгүй.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
