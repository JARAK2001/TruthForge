/** Cliente HTTP del laboratorio. Access token en memoria, refresh en localStorage. */

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const REFRESH_KEY = "truthforge-refresh-v1";

let accessToken: string | undefined;

export function setAccessToken(token: string | undefined): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    // sin almacenamiento: la sesión vive solo en memoria
  }
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

async function raw(path: string, init: RequestInit, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${BASE}/api${path}`, { ...init, headers });
}

/** POST /api/auth/refresh con rotación. Null si la sesión murió. */
async function tryRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await raw("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: refresh }) });
  if (!res.ok) {
    setAccessToken(undefined);
    setRefreshToken(null);
    return null;
  }
  const body = (await res.json()) as { accessToken: string; refreshToken: string };
  setAccessToken(body.accessToken);
  setRefreshToken(body.refreshToken);
  return body.accessToken;
}

/**
 * request con reintento único: ante 401 prueba el refresh y repite.
 * onExpired se usa para redirigir a /cuenta cuando la sesión muere.
 */
export async function api<T>(path: string, init: RequestInit = {}, onExpired?: () => void): Promise<T> {
  let res = await raw(path, init, accessToken);
  if (res.status === 401 && getRefreshToken()) {
    const next = await tryRefresh();
    if (next) res = await raw(path, init, next);
    else onExpired?.();
  }
  if (res.status === 401) {
    onExpired?.();
    throw new ApiError(401, "Sesión expirada. Entra de nuevo.");
  }
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  xp: number;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface ServerProgress {
  xp: number;
  level: number;
  streak: number;
  attempts: number;
  achievements: { slug: string; name: string; earnedAt: string }[];
}

export interface ServerExercise {
  id: string;
  prompt: string;
  formula: string;
  kind: string;
  assignment: Record<string, boolean> | null;
  levelId: string | null;
  slug?: string;
}
