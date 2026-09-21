import { configUrl, normalizeApiUrl } from './config.ts';
let basePromise: Promise<string> | undefined;
export class ApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export async function apiBase(): Promise<string> {
  if (!basePromise) basePromise = fetch(configUrl(), { cache: 'no-store', signal: AbortSignal.timeout(10000) }).then(async response => {
    if (!response.ok) throw new ApiError('Cannot load the streaming service configuration.', response.status);
    const config = await response.json() as { apiUrl?: string };
    const url = normalizeApiUrl(config.apiUrl || '');
    if (!url) throw new ApiError('The streaming service has not been connected yet.', 503);
    return url;
  }).catch(error => { basePromise = undefined; throw error; });
  return basePromise;
}
export async function apiFetch<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  if (!path.startsWith('/api/') && path !== '/health') throw new ApiError('Invalid API path.', 400);
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
export async function wsUrl(path: string) {
  if (!path.startsWith('/ws/')) throw new ApiError('Invalid WebSocket path.', 400);
  return `${(await apiBase()).replace(/^http/, 'ws')}${path}`;
}
