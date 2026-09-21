import { Component,useEffect,type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from '@/app/providers';
import Privacy from '@/app/privacy/page';
import Terms from '@/app/terms/page';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { AppFooter } from '@/components/app-footer';
import { StreamRoom } from '@/components/stream-room';
import { ExploreFeed } from '@/components/explore-feed';
import { FollowingFeed } from '@/components/following-feed';
import { CreatorStudio } from '@/components/creator-studio';
import { GoLive } from '@/components/go-live';
import { CategoryCards } from '@/components/category-cards';
import { ChannelDirectory } from '@/components/channel-directory';
import { ScheduleList } from '@/components/schedule-list';
import Link,{RouteEffects,usePathname} from '@/lib/navigation';
import { matchRoute } from '@/lib/paths';
import '@/app/globals.css';

const basePath=new URL(document.baseURI).pathname;
if(!location.hash&&location.pathname.startsWith(basePath)&&location.pathname!==basePath){const path='/'+location.pathname.slice(basePath.length);if(path!=='/index.html'&&path!=='/404.html')history.replaceState(null,'',basePath+'#'+path+location.search);}
const titles:Record<string,string>={home:'Browse',channels:'Channels',categories:'Categories',category:'Browse category','go-live':'Go Live',following:'Following',studio:'Creator studio',schedule:'Schedule',privacy:'Privacy',terms:'Terms',stream:'Channel',missing:'Page not found'};
function App(){
  const path=usePathname(),route=matchRoute(path);
  useEffect(()=>{document.title=titles[route.page]+' · Sub Stream';},[route.page]);
  let content:ReactNode;
  switch(route.page){
    case 'home':content=<main className="browse-page"><ExploreFeed/></main>;break;
    case 'categories':content=<main className="browse-page categories-page"><div className="page-title-row"><div><p className="kicker">FOLLOW YOUR CURIOSITY</p><h1>Find your kind of stream.</h1><p>From a quick catch-up to a late-night build.</p></div></div><CategoryCards/><div className="category-bottom"><p>Looking for a particular coin?</p><Link className="soft-button" href="/channels">Browse all channels ↗</Link></div></main>;break;
    case 'category':case 'channels':content=<main className="browse-page"><ChannelDirectory key={path} categoryId={route.slug}/></main>;break;
    case 'following':content=<main className="browse-page"><div className="page-title-row"><div><p className="kicker">YOUR CORNER OF SUB STREAM</p><h1>Following</h1><p>The communities you keep coming back to.</p></div></div><FollowingFeed/></main>;break;
    case 'studio':content=<main className="browse-page studio-page"><CreatorStudio/></main>;break;
    case 'go-live':content=<main className="browse-page"><GoLive key={path} marketId={route.slug}/></main>;break;
    case 'schedule':content=<main className="browse-page"><div className="page-title-row"><div><p className="kicker">MAKE TIME FOR YOUR COMMUNITY</p><h1>Coming up next</h1><p>All times are shown in your timezone.</p></div><Link className="soft-button" href="/studio">Schedule a broadcast</Link></div><ScheduleList/></main>;break;
    case 'privacy':content=<Privacy/>;break;
    case 'terms':content=<Terms/>;break;
    case 'stream':content=<StreamRoom key={route.slug} slug={route.slug!}/>;break;
    default:content=<main className="browse-page"><div className="empty-state"><h1>Page not found</h1><Link className="primary-action" href="/">Back to Browse</Link></div></main>;
  }
  return <Providers><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.querySelector('main')?.focus();}}>Skip to content</a><AppHeader/><AppSidebar/><div className="app-content" id="main-content">{content}<AppFooter/></div><RouteEffects/></Providers>;
}
class AppBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<main className="browse-page"><h1>Sub Stream could not load</h1><p>Reload the page to try again.</p><button className="primary-action" onClick={()=>location.reload()}>Reload</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<AppBoundary><App/></AppBoundary>);
