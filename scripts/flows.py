"""Check the web app's route guards and BFF against the running API.

Drives http://localhost:3002 the way a browser would: one cookie jar per
role, no token ever supplied by hand.
"""

import http.cookiejar
import json
import urllib.error
import urllib.request

BASE = "http://localhost:3002"
fails = []


def opener_for():
    jar = http.cookiejar.CookieJar()
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(jar),
        NoRedirect(),
    ), jar


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """Redirects are the thing under test, so they are not followed."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def call(op, method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method)
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with op.open(req, data, timeout=30) as r:
            raw = r.read().decode("utf-8", "replace")
            return r.status, raw, dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), dict(e.headers)


def header(headers, name):
    """Case-insensitive lookup — Next answers with a lowercased `location`."""
    for key, value in headers.items():
        if key.lower() == name.lower():
            return value
    return ""


def check(label, got, want, extra=""):
    ok = got == want
    print(f"  {'PASS' if ok else 'FAIL'}  {label}: {got} (want {want}) {extra}")
    if not ok:
        fails.append(label)


def login(email, pw):
    op, jar = opener_for()
    status, raw, _ = call(op, "POST", "/api/auth/login", {"email": email, "password": pw})
    assert status == 200, (status, raw)
    names = sorted(c.name for c in jar)
    return op, json.loads(raw)["data"]["user"], names


def section(name):
    print("\n" + "=" * 70)
    print(name)
    print("=" * 70)


ROLE_HOME = {"manager": "/manager", "employee": "/washer", "customer": "/book"}

MANAGER_ROUTES = [
    "/manager",
    "/manager/bookings",
    "/manager/roster",
    "/manager/timesheets",
    "/manager/staff",
    "/manager/catalogue",
]
WASHER_ROUTES = ["/washer", "/washer/jobs", "/washer/timesheet"]
CUSTOMER_ROUTES = ["/book", "/book/new", "/book/bookings"]

# ── 1. Anonymous ─────────────────────────────────────────────────────────
section("1. Anonymous visitors")
anon, _ = opener_for()
status, _, headers = call(anon, "GET", "/manager")
check("/manager with no session redirects", status, 307, f"-> {header(headers, 'location')}")
check("  and carries ?next so the deep link survives", "next=%2Fmanager" in (header(headers, "location")), True)

for path in ["/washer", "/book"]:
    status, _, headers = call(anon, "GET", path)
    check(f"{path} with no session redirects", status, 307, f"-> {header(headers, 'location')}")

status, _, _ = call(anon, "GET", "/login")
check("/login is reachable", status, 200)
status, raw, _ = call(anon, "GET", "/api/bff/manager/staff")
check("BFF with no session", status, 401, json.loads(raw)["error"]["code"])

# ── 2. Sessions ──────────────────────────────────────────────────────────
section("2. Sign-in and cookies")
mgr, mgr_user, mgr_cookies = login("manager@carwash.mn", "manager123")
wsh, wsh_user, _ = login("bat@carwash.mn", "employee123")
cst, cst_user, _ = login("customer@example.mn", "customer123")

check("manager role from cookie", mgr_user["role"], "manager", mgr_user["name"])
check("washer role from cookie", wsh_user["role"], "employee", wsh_user["name"])
check("customer role from cookie", cst_user["role"], "customer", cst_user["name"])
check("session cookies set", mgr_cookies, ["cw_token", "cw_user"])

status, raw, _ = call(mgr, "POST", "/api/auth/login", {"email": "manager@carwash.mn", "password": "wrong"})
check("wrong password refused", status, 401, json.loads(raw)["error"]["code"])

# ── 3. Each role reaches its own screens ─────────────────────────────────
section("3. Every screen renders for its own role")
for path in MANAGER_ROUTES:
    status, _, _ = call(mgr, "GET", path)
    check(f"manager {path}", status, 200)
for path in WASHER_ROUTES:
    status, _, _ = call(wsh, "GET", path)
    check(f"washer {path}", status, 200)
for path in CUSTOMER_ROUTES:
    status, _, _ = call(cst, "GET", path)
    check(f"customer {path}", status, 200)

# ── 4. Nobody reaches anybody else's ─────────────────────────────────────
section("4. Cross-role navigation is turned away")
for op, role, foreign in [
    (cst, "customer", MANAGER_ROUTES[0]),
    (cst, "customer", WASHER_ROUTES[0]),
    (wsh, "employee", MANAGER_ROUTES[0]),
    (wsh, "employee", CUSTOMER_ROUTES[0]),
    (mgr, "manager", WASHER_ROUTES[0]),
    (mgr, "manager", CUSTOMER_ROUTES[0]),
]:
    status, _, headers = call(op, "GET", foreign)
    location = header(headers, "location")
    check(f"{role} -> {foreign}", status, 307, f"sent to {location.replace(BASE, '') or '?'}")
    check(f"  {role} lands on their own area", ROLE_HOME[role] in location, True)

# ── 5. The BFF grants nothing ────────────────────────────────────────────
section("5. The proxy carries identity, it does not grant it")
for op, role, path in [
    (cst, "customer", "manager/staff"),
    (cst, "customer", "manager/reports/daily"),
    (cst, "customer", "employee/jobs"),
    (wsh, "employee", "manager/staff"),
    (wsh, "employee", "customer/cars"),
    (mgr, "manager", "employee/jobs"),
]:
    status, raw, _ = call(op, "GET", f"/api/bff/{path}")
    code = json.loads(raw).get("error", {}).get("code") if raw else None
    check(f"{role} calling /{path}", status, 403, code)

status, raw, _ = call(mgr, "GET", "/api/bff/manager/staff")
check("manager calling /manager/staff", status, 200, f"{len(json.loads(raw)['data'])} people")

# ── 6. The audience split survives the proxy ─────────────────────────────
section("6. Response shapes stay audience-specific through the BFF")
status, raw, _ = call(cst, "GET", "/api/bff/customer/reservations?from=2026-08-15&to=2026-10-15")
rows = json.loads(raw)["data"]
check("customer reads their own bookings", status, 200, f"{len(rows)} rows")
if rows:
    check("  no bonus_mnt in the customer's copy", any("bonus_mnt" in r for r in rows), False)
    check("  no customer block in the customer's copy", any("customer" in r for r in rows), False)

status, raw, _ = call(wsh, "GET", "/api/bff/employee/jobs?from=2026-08-15&to=2026-10-15")
jobs = json.loads(raw)["data"]
check("washer reads their own jobs", status, 200, f"{len(jobs)} rows")
if jobs:
    check("  bonus_mnt present on the staff copy", all("bonus_mnt" in j for j in jobs), True)
    check("  customer contact present on the staff copy", all("customer" in j for j in jobs), True)

status, raw, _ = call(anon, "GET", "/api/readyz")
ready = json.loads(raw)
check("readyz passes through", status, 200, f"env={ready.get('env')} degraded={ready.get('degraded')}")

# ── 7. Signing out ───────────────────────────────────────────────────────
section("7. Signing out")
status, _, _ = call(mgr, "POST", "/api/auth/logout")
check("logout succeeds", status, 200)
status, _, headers = call(mgr, "GET", "/manager")
check("manager page after logout redirects", status, 307, f"-> {(header(headers, 'location') or '').replace(BASE, '')}")
status, _, _ = call(mgr, "GET", "/api/bff/manager/staff")
check("BFF after logout", status, 401)

print("\n" + "=" * 70)
if fails:
    print(f"{len(fails)} CHECK(S) FAILED:")
    for f in fails:
        print("  -", f)
else:
    print("ALL CHECKS PASSED")
print("=" * 70)
