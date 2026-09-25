// Client-side API helper.
//
// Every call goes through the same-origin BFF proxy at /api/bff/*, which
// attaches the httpOnly auth cookie as a Bearer header server-side — no token
// ever touches client JavaScript. Responses use the backend envelope
// { success, data, error }.

import type { ApiEnvelope } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly domain: string;

  constructor(status: number, code: string, domain: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.domain = domain;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

// The backend refused our token (expired, revoked, or the account was
// suspended mid-session). Clear the cookies first — otherwise the route guard
// sees a cookie and bounces the login page straight back — then land on login
// with a reason so it can explain the forced sign-out rather than looking like
// a random logout.
let loggingOut = false;
function forceLogout() {
  if (loggingOut || typeof window === "undefined" || window.location.pathname.startsWith("/login")) return;
  loggingOut = true;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  void fetch("/api/auth/logout", { method: "POST" })
    .catch(() => undefined)
    .finally(() => {
      window.location.assign(`/login?reason=session-expired&next=${next}`);
    });
}

/** True when the backend refused the call for the caller's role. */
export function isForbidden(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status === 403;
}

/** True when the error carries this exact backend code. */
export function hasCode(err: unknown, code: string): err is ApiError {
  return err instanceof ApiError && err.code === code;
}

function buildUrl(path: string, query?: QueryParams) {
  const url = `/api/bff/${path.replace(/^\/+/, "")}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  if (res.status === 401) forceLogout();
  if (res.status === 204) return undefined as T;

  let envelope: ApiEnvelope<T> | undefined;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // Non-JSON body: a proxy failure or an HTML error page.
  }

  if (!res.ok || !envelope?.success) {
    const err = envelope?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "UNKNOWN",
      err?.domain ?? "GENERAL",
      err?.message ?? `Request failed with status ${res.status}`,
    );
  }
  return envelope.data as T;
}

async function request<T>(
  method: string,
  path: string,
  options: { query?: QueryParams; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await fetch(buildUrl(path, options.query), {
    method,
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
  return parseEnvelope<T>(res);
}

/**
 * Sends a multipart body.
 *
 * Separate from `request` because that one JSON-encodes everything and sets
 * Content-Type itself. A multipart upload must NOT have its Content-Type set
 * by us: the browser writes it, including the boundary token it generated,
 * and a hand-written header loses the boundary and produces a body the server
 * cannot parse.
 */
async function upload<T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`/api/bff/${path}`, { method: "POST", body: form, signal });
  return parseEnvelope<T>(res);
}

export const api = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) => request<T>("GET", path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: QueryParams) => request<T>("POST", path, { body, query }),
  put: <T>(path: string, body?: unknown, query?: QueryParams) => request<T>("PUT", path, { body, query }),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, { body }),
  upload,
};

/**
 * Human-readable message for a toast.
 *
 * The ApiError and Error branches return whatever the backend or the
 * runtime produced — still English, since translating the API's own error
 * text is a separate, backend-side change this pass does not make. Only the
 * final fallback, for a thrown value that is neither, is this file's own
 * text and gets translated.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Тодорхойгүй алдаа гарлаа";
}

/**
 * True for the three 402 codes the platform introduced.
 *
 * They are grouped because a screen treats them alike — none is retryable and
 * all three are resolved by changing the plan, not by the person trying
 * again — while the MESSAGE differs, so the backend's prose is what gets
 * shown rather than one sentence invented here.
 *
 * Deliberately separate from `forbidden`. A 403 means this person may not do
 * it; a 402 means this business has not bought it. Telling a manager "your
 * role does not include this" when the real answer is "your plan does not"
 * sends them to the wrong person.
 */
export function isPlanLimited(err: unknown): err is ApiError {
  return hasCode(err, "MODULE_NOT_ENTITLED") || hasCode(err, "SUBSCRIPTION_REQUIRED") || hasCode(err, "LIMIT_EXCEEDED");
}
