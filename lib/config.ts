// Only a public API origin is allowed here. Provider keys never enter the bundle.
export function normalizeApiUrl(value: unknown): string {
  if (typeof value !== 'string') throw new Error('API_BASE_URL must be a public HTTPS origin.');
  if (!value.trim()) return '';
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('API_BASE_URL must be a valid HTTPS origin.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('API_BASE_URL must be an HTTPS origin with no path, credentials, query, or fragment. HTTP is allowed only on localhost.');
  }
  return url.origin;
}
export function configUrl(base = document.baseURI): string {
  return new URL('config.json', base).href;
}
