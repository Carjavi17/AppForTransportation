import { API_URL } from "./config";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

// --- Connection status (shared by the whole app) ---
let online = true;
const listeners = new Set<() => void>();

function setOnline(value: boolean) {
  if (online !== value) {
    online = value;
    listeners.forEach((listener) => listener());
  }
}

export function getOnline() {
  return online;
}

export function subscribeConnection(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// --- Invalid session (401 with a token) ---
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function reportUnauthorized() {
  unauthorizedHandler?.();
}

// --- Errors ---
export class NetworkError extends Error {
  constructor() {
    super("Sin conexión con el servidor");
    this.name = "NetworkError";
  }
}

export function isNetworkError(error: unknown) {
  return error instanceof Error && error.name === "NetworkError";
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Gateway errors: the proxy is up but the server behind it is restarting or down
const GATEWAY_ERRORS = [502, 503, 504];

export async function request<T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const attempts = method === "GET" ? 3 : 1; // only safe reads are retried
  let response: Response | null = null;

  for (let attempt = 1; attempt <= attempts && !response; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const result = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (GATEWAY_ERRORS.includes(result.status) && attempt < attempts) {
        await wait(500 * attempt); // try again
      } else {
        response = result;
      }
    } catch {
      if (attempt < attempts) await wait(500 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  if (!response || GATEWAY_ERRORS.includes(response.status)) {
    setOnline(false);
    throw new NetworkError();
  }
  setOnline(true);

  const data = await response.json().catch(() => null);
  if (response.status === 401 && token) reportUnauthorized();
  if (!response.ok) throw new Error(data?.error ?? "Error del servidor");
  return data as T;
}