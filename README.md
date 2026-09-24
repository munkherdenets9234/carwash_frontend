# Car Wash — web frontend

Three apps behind one sign-in, against the Go API in [`../carwash`](../carwash):

| Area | Audience | Shape |
|---|---|---|
| `/manager` | Manager | Desktop back office with a sidebar |
| `/washer` | Washer | Phone, bottom tabs |
| `/book` | Customer | Phone, bottom tabs |

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Biome.
Structure and conventions follow `tradecore-backoffice`: a BFF proxy with
httpOnly cookies, an envelope-aware API client, co-located `_components`, and
one navigation list driving the shell.

---

## Running it

```bash
cp .env.example .env.local     # BACKEND_URL=http://localhost:8090
npm install
npm run dev                    # http://localhost:3002
```

The API has to be up and seeded:

```bash
cd ../carwash && make reseed && make run
```

Sign in with any seeded account — the login screen has one-tap buttons for
all three roles. Where you land depends on your role, not on the URL you
typed.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on 3002 |
| `npm run build` | Production build, including a full type check |
| `npm run typecheck` | Types only |
| `npm run check` | Biome lint + format |
| `npm run check:fix` | …and apply the fixes |
| `npm run flows` | Drives the running app and checks every route guard |

`npm run flows` is the verification that matters: it logs in as each role
with its own cookie jar and asserts that anonymous visitors are redirected
(with `?next=` preserved), that each role reaches only its own screens, that
a customer or washer calling a manager endpoint through the BFF gets 403, and
that the customer's booking JSON still carries no `bonus_mnt` after passing
through the proxy. Roughly 60 checks.

---

## How auth works

```
browser ──▶ /api/auth/login ──▶ Go /api/v1/auth/login
              sets cw_token + cw_user, httpOnly

browser ──▶ /api/bff/<path> ──▶ Go /api/v1/<path>
              attaches Authorization: Bearer <cw_token>
```

**No token ever reaches client JavaScript.** The login response carries the
user and nothing else; `document.cookie` cannot see either cookie. Verified
in the browser, not just asserted.

Three layers, doing different jobs:

1. **`src/proxy.ts`** (Next 16's renamed Middleware) is a *navigation* guard.
   It reads the role from the session cookie to pick a shell and to send a
   customer who typed `/manager` to `/book` rather than to a screen whose
   every call would 403. It is a convenience, not a control.
2. **Each area's `layout.tsx`** re-checks the role on the server, so the
   chrome never disagrees with the API about who you are.
3. **The Go API** is the only real authority. It loads the user on every
   request and checks their role against the database, so a suspended
   washer's existing session stops working on their next tap — not whenever
   their token happens to expire. Getting past layers 1 and 2 buys an empty
   screen.

---

## Shape

```
src/
  proxy.ts                  navigation guard (Next 16 Middleware)
  app/
    api/
      auth/{login,logout}   sets and clears the httpOnly session
      bff/[...path]         the only route that holds the token
      readyz                passes the API's readiness through
    login/                  one form, three roles
    manager/                desktop shell + 6 screens
    washer/                 phone shell + 3 screens
    book/                   phone shell + 3 screens
  components/
    ui/                     button, field, card, badge, table
    app/                    page-header, states, stat, pickers, shells
  hooks/
    use-api.ts              one abortable request per parameter change
    use-query-param.ts      filters that live in the URL
  lib/
    api/{client,server,types}.ts
    utils.ts                formatters, all timezone-aware
  navigation/sidebar-items.ts
  styles/globals.css        the design tokens
```

Conventions worth knowing before adding a screen:

- **`page.tsx` stays thin.** It is a Server Component that composes one
  client screen from `_components/`. Screens that read `useSearchParams` are
  wrapped in `Suspense` there, or the whole route opts out of static
  rendering.
- **Semantic tokens only.** `bg-card`, `text-muted-foreground`,
  `border-border` — never a raw hex. Dark mode and any rebrand are one edit
  in `globals.css`.
- **The audience split is in the types.** `Reservation` is the customer's
  shape and `StaffReservation` is the staff shape; they are separate
  interfaces on purpose, mirroring `internal/view` on the backend. Widening
  one to serve both screens is how `bonus_mnt` ends up in a customer's
  response.
- **Dates go through `lib/utils`.** Everything formats in
  `Asia/Ulaanbaatar`, because the API cuts every report and every `?day=` on
  that calendar day. `toISOString().slice(0,10)` gives the UTC day, which is
  yesterday for eight hours of every evening here.

---

## What this frontend does not do yet

- **No refresh tokens.** The session lasts as long as the backend token
  (12h) and then bounces to login with `?reason=session-expired`.
- **No optimistic updates.** Every mutation waits for the API and then
  re-fetches. Correct, and a visible pause on a slow connection.
- **Maps are placeholders.** The washer's clock-in screen shows the measured
  distance and the site's radius as text; there is no map tile. The numbers
  are the part that decides anything.
- **The clock-in demo shortcut.** `/washer` offers a "pretend I am standing
  at the site" button so the geofence can be shown on a desktop. It is
  rendered only when `/api/readyz` reports a non-production environment —
  asked of the server rather than inferred, so a staging build cannot ship
  it by accident.
- **No tests beyond `npm run flows`.** That script needs a running app and a
  seeded database, so it is not something CI would catch a regression with.
  Component tests are the gap.
