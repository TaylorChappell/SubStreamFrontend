import { Component, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from '@/app/providers';
import Home from '@/app/page';
import Following from '@/app/following/page';
import Studio from '@/app/studio/page';
import Schedule from '@/app/schedule/page';
import Privacy from '@/app/privacy/page';
import Terms from '@/app/terms/page';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { StreamRoom } from '@/components/stream-room';
import Link, { RouteEffects, usePathname } from '@/lib/navigation';
import { matchRoute } from '@/lib/paths';
import '@/app/globals.css';

// GitHub serves 404.html for legacy clean URLs. Recover the route without a server.
const basePath = new URL(document.baseURI).pathname;
if (!location.hash && location.pathname.startsWith(basePath) && location.pathname !== basePath) {
  const path = '/' + location.pathname.slice(basePath.length);
  if (path !== '/index.html' && path !== '/404.html') history.replaceState(null, '', basePath + '#' + path + location.search);
}
const titles: Record<string, string> = { home: 'Live streams', following: 'Following', studio: 'Creator studio', schedule: 'Schedule', privacy: 'Privacy', terms: 'Terms', stream: 'Stream room', missing: 'Page not found' };
function App() {
  const path = usePathname();
  const route = matchRoute(path);
  useEffect(() => { document.title = titles[route.page] + ' · Sub Stream'; }, [route.page]);
  let content: ReactNode;
  switch(route.page) {
    case 'home': content = <Home/>; break;
    case 'following': content = <Following/>; break;
    case 'studio': content = <Studio/>; break;
    case 'schedule': content = <Schedule/>; break;
    case 'privacy': content = <Privacy/>; break;
    case 'terms': content = <Terms/>; break;
    case 'stream': content = <div className="app-shell"><AppHeader/><StreamRoom key={route.slug} slug={route.slug!}/><AppFooter/></div>; break;
    default: content = <div className="app-shell"><AppHeader/><main className="simple-page"><div className="empty-state"><h1>Page not found</h1><Link href="/">Back to Explore</Link></div></main><AppFooter/></div>;
  }
  return <Providers>{content}<RouteEffects/></Providers>;
}
class AppBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="simple-page"><h1>Sub Stream could not load</h1><p>Reload the page to try again.</p><button onClick={() => location.reload()}>Reload</button></main> : this.props.children; }
}
createRoot(document.getElementById('root')!).render(<AppBoundary><App/></AppBoundary>);
