const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Envelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: { code: string; message: string };
};

async function rawRequest<T>(
  path: string,
  options: RequestInit,
  withAuth: boolean
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const envelope: Envelope<T> = await res.json();

  if (!res.ok || !envelope.success) {
    throw new ApiError(
      res.status,
      envelope.error?.code || "unknown_error",
      envelope.error?.message || "Something went wrong"
    );
  }

  return envelope.data as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const data = await rawRequest<{ access_token: string; refresh_token: string }>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      false
    );
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}


export async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  try {
    return await rawRequest<T>(path, options, withAuth);
  } catch (err) {
    if (withAuth && err instanceof ApiError && err.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return await rawRequest<T>(path, options, true);
      }
    }
    throw err;
  }
}

export const api = {
  get: <T,>(path: string, withAuth = false) =>
    request<T>(path, { method: "GET" }, withAuth),
  post: <T,>(path: string, body?: unknown, withAuth = false) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, withAuth),
  put: <T,>(path: string, body?: unknown, withAuth = false) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, withAuth),
  delete: <T,>(path: string, withAuth = false) =>
    request<T>(path, { method: "DELETE" }, withAuth),
};
