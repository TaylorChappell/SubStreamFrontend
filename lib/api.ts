let basePromise: Promise<string> | undefined;
export class ApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export async function apiBase(): Promise<string> {
  if (!basePromise) basePromise = fetch('/api/config', { cache: 'no-store' }).then(async response => {
    const config = await response.json() as { apiUrl?: string };
    if (!config.apiUrl) throw new ApiError('The streaming service has not been connected yet.', 503);
    return config.apiUrl.replace(/\/$/, '');
  }).catch(error => { basePromise = undefined; throw error; });
  return basePromise;
}
export async function apiFetch<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const base = await apiBase();
  const headers = new Headers(init.headers);
  if (init.body != null) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  let response: Response;
  try { response = await fetch(`${base}${path}`, { ...init, headers, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(15000) }); }
  catch (error) { if (init.signal?.aborted) throw error; throw new ApiError('Cannot reach the streaming service. Please try again.', 0); }
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('substream:session-expired'));
    throw new ApiError(payload.error ?? `Request failed (${response.status})`, response.status);
  }
  return payload as T;
}
export async function wsUrl(path: string) { return `${(await apiBase()).replace(/^http/, 'ws')}${path}`; }
