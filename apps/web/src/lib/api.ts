const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  cache?: RequestCache;
}

export async function api<T = any>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    cache: opts.cache ?? "no-store",
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`API ${r.status}: ${text}`);
  }
  if (r.status === 204) return undefined as any;
  return r.json();
}

export const API_BASE = API;
