const configuredBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const API_BASE_URL = configuredBase;
export const API_CONFIGURED = Boolean(configuredBase);

export async function apiFetch<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  if (!configuredBase) throw new Error("The Sub Stream API is not configured for this build.");
  const response = await fetch(`${configuredBase}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload as T;
}

export function wsUrl(path: string) {
  if (!configuredBase) throw new Error("The Sub Stream API is not configured for this build.");
  return `${configuredBase.replace(/^http/, "ws")}${path}`;
}
