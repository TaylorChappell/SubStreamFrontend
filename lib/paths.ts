export function routeHref(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Expected an internal application path.');
  return '#' + path;
}
export function readRoute(hash: string): string {
  const value = hash.replace(/^#/, '');
  return value.startsWith('/') && !value.startsWith('//') ? value.split('?')[0].replace(/\/+$/, '') || '/' : '/';
}
export function matchRoute(path: string): { page: string; slug?: string } {
  const pages: Record<string, string> = { '/': 'home', '/following': 'following', '/studio': 'studio', '/schedule': 'schedule', '/privacy': 'privacy', '/terms': 'terms' };
  if (pages[path]) return { page: pages[path] };
  const match = /^\/stream\/([^/]+)$/.exec(path);
  if (match) { try { const slug = decodeURIComponent(match[1]); if (/^[a-zA-Z0-9-]{1,120}$/.test(slug)) return { page: 'stream', slug }; } catch { /* malformed escape */ } }
  return { page: 'missing' };
}
export function assetUrl(path: string, base = document.baseURI): string {
  return new URL(path.replace(/^\/+/, ''), base).href;
}
export function channelUrl(slug: string, base = document.baseURI): string {
  return new URL(routeHref('/stream/' + encodeURIComponent(slug)), base).href;
}
