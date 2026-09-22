import { useEffect,useState } from 'react';
import Link,{usePathname} from '@/lib/navigation';
import { apiFetch } from '@/lib/api';
import type { Stream } from '@/lib/types';
import { CoinAvatar } from './coin-avatar';
import { useWallet } from '@/app/providers';
export function AppSidebar() {
  const path=usePathname(),{token}=useWallet();
  const [channels,setChannels]=useState<Stream[]>([]),[failed,setFailed]=useState(false);
  useEffect(()=>{const c=new AbortController();async function load(){try{const data=await apiFetch<{streams:Stream[]}>(token?'/api/following':'/api/channels?limit=6',{signal:c.signal},token);if(!c.signal.aborted){setChannels(data.streams.slice(0,6));setFailed(false);}}catch{if(!c.signal.aborted)setFailed(true);}}void load();const timer=setInterval(()=>void load(),30000);window.addEventListener('substream:follow',load);return()=>{c.abort();clearInterval(timer);window.removeEventListener('substream:follow',load);};},[token]);
  const nav=[['/','Browse'],['/categories','Categories'],['/channels','All channels'],['/following','Following'],['/schedule','Schedule']];
  return <aside className="app-sidebar"><nav aria-label="Primary navigation">{nav.map(([href,label])=><Link key={href} href={href} aria-current={path===href?'page':undefined} className={path===href||(href==='/categories'&&path.startsWith('/category/'))?'active':''}>{label}{href==='/'&&<span className="nav-live-dot"/>}</Link>)}</nav>{(channels.length>0||failed)&&<div className="sidebar-section"><h2>{token?'Your channels':'Around the stream'}</h2>{channels.map(c=><Link className="sidebar-channel" key={c.id} href={`/stream/${c.slug}`}><CoinAvatar symbol={c.market.symbol} src={c.market.imageUrl} size="small"/><span><b>{c.market.symbol}</b><small>{c.status==='live'?c.title:'Offline'}</small></span>{c.status==='live'&&<i className="nav-live-dot"/>}</Link>)}{!channels.length&&failed&&<p>Channels are temporarily unavailable.</p>}</div>}<div className="sidebar-bottom"><Link className={path==='/studio'?'active':''} href="/studio">Creator studio <span>↗</span></Link></div></aside>;
}
