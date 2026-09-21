import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes } from 'react';
import { readRoute, routeHref } from './paths.ts';
export { assetUrl, channelUrl } from './paths.ts';

const subscribe = (notify: () => void) => {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
};
const snapshot = () => readRoute(window.location.hash);
const router = { push(path: string) { window.location.hash = routeHref(path); } };
export function useRouter() { return router; }
export function usePathname() { return useSyncExternalStore(subscribe, snapshot, () => '/'); }
export function RouteEffects() {
  const path = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    main?.setAttribute('tabindex', '-1');
    main?.focus({ preventScroll: true });
  }, [path]);
  return null;
}
export default function Link({ href, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }) {
  return <a href={href.startsWith('/') && !href.startsWith('//') ? routeHref(href) : href} {...props}/>;
}
