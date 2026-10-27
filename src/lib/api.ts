import { API_URL, CONFIG_ERROR } from './config';

const REQUEST_TIMEOUT_MS = 45_000; // the free-tier backend can take ~30s to wake up

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** Registered by the session so an expired or revoked token signs the user out. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

type Method = 'GET' | 'POST' | 'PUT';

export async function apiRequest<T>(path: string, { method = 'GET', body }: { method?: Method; body?: unknown } = {}): Promise<T> {
  if (CONFIG_ERROR) throw new ApiError(0, 'CONFIG', CONFIG_ERROR);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', "Can't reach Affiliate Hub right now. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && authToken) onUnauthorized?.();
    const error = payload?.error;
    throw new ApiError(response.status, error?.code ?? 'HTTP_ERROR', error?.message ?? `Request failed (${response.status})`, error?.details);
  }
  return payload as T;
}

/** A readable message for any error, including per-field validation details. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
      return err.details
        .map((d: { field?: string | null; message?: string }) => (d.field ? `${d.field}: ${d.message}` : d.message))
        .join('\n');
    }
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}
