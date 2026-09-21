export function routeHref(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Expected an internal application path.');
  return '#' + path;
}
export function readRoute(hash: string): string {
  const value = hash.replace(/^#/, '');
  return value.startsWith('/') && !value.startsWith('//') ? value.split('?')[0].replace(/\/+$/, '') || '/' : '/';
}
export function matchRoute(path: string): { page: string; slug?: string } {
  const pages: Record<string, string> = { '/': 'home', '/channels': 'channels', '/categories': 'categories', '/go-live': 'go-live', '/following': 'following', '/studio': 'studio', '/schedule': 'schedule', '/privacy': 'privacy', '/terms': 'terms' };
  if (pages[path]) return { page: pages[path] };
  const category = /^\/category\/(community|development|ama|gaming|art|education)$/.exec(path);
  if(category) return { page: 'category', slug: category[1] };
  const live = /^\/go-live\/([^/]+)$/.exec(path);
  if(live) { try { const id=decodeURIComponent(live[1]);if(id.length<=100&&!/[\/\u0000-\u001f]/.test(id))return {page:'go-live',slug:id}; }catch{} }
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
