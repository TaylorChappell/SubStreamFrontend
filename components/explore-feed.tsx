import { useEffect,useState } from 'react';
import Link from '@/lib/navigation';
import { apiFetch } from '@/lib/api';
import type { Stream } from '@/lib/types';
import { StreamCard } from './stream-card';
import { CategoryCards } from './category-cards';
import { ScheduleList } from './schedule-list';
import { assetUrl } from '@/lib/paths';
export function ExploreFeed() {
  const [streams,setStreams]=useState<Stream[]>([]),[channels,setChannels]=useState<Stream[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0),[limit,setLimit]=useState(12),[more,setMore]=useState(false);
  useEffect(()=>{const c=new AbortController();async function load(){try{const data=await apiFetch<{streams:Stream[];hasMore:boolean}>(`/api/explore?limit=${limit}`,{signal:c.signal});if(!c.signal.aborted){setStreams(data.streams);setMore(data.hasMore);setError('');}}catch(e){if(!c.signal.aborted)setError((e as Error).message);}finally{if(!c.signal.aborted)setLoading(false);}}
    void load();void apiFetch<{streams:Stream[]}>('/api/channels?limit=4&status=offline',{signal:c.signal}).then(d=>{if(!c.signal.aborted)setChannels(d.streams);}).catch(()=>{});const timer=setInterval(()=>void load(),30000);return()=>{c.abort();clearInterval(timer);};},[retry,limit]);
  return <><div className="page-title-row"><div><h1>Browse</h1></div><Link className="text-link" href="/channels">Explore all channels ↗</Link></div>
    <section className="browse-hero"><div className="hero-copy"><h2>Streaming on<br/><em>AQUA</em></h2><div><Link className="white-button" href="/go-live">Start your stream <span>↗</span></Link><Link className="hero-secondary" href="/studio">Creator studio</Link></div></div><div className="hero-art" aria-hidden="true"><div className="hero-waterlines"><i/><i/><i/><i/></div><img src={assetUrl('sub-stream-logo.png')} alt=""/></div></section>
    <section className="browse-section"><div className="section-heading"><h2>Categories</h2><Link href="/categories">All categories ↗</Link></div><CategoryCards/></section>
    <section className="browse-section"><div className="section-heading"><h2><span className="live-heading-dot"/>Live now</h2><button className="text-link" onClick={()=>{setLoading(true);setRetry(v=>v+1);}} disabled={loading}>{loading?'Updating…':'Refresh'}</button></div>
    {error?<div className="empty-state" role="alert"><h3>Streams are unavailable</h3><p>{error}</p><button className="soft-button" onClick={()=>setRetry(v=>v+1)}>Try again</button></div>:loading&&!streams.length?<div className="stream-skeletons" aria-label="Loading streams">{[1,2,3].map(n=><div key={n}/>)}</div>:streams.length?<div className="stream-grid">{streams.map(s=><StreamCard key={s.id} stream={s}/>)}</div>:<div className="quiet-empty"><h3>No one’s live right now.</h3><Link className="primary-action" href="/go-live">Go Live</Link></div>}
    {more&&limit<48&&<button className="soft-button load-more" onClick={()=>setLimit(v=>v+12)}>Show more streams</button>}</section>
    {channels.length>0&&<section className="browse-section"><div className="section-heading"><div><h2>Keep up with your communities</h2><p>Offline now. Always worth following.</p></div><Link href="/channels">All channels ↗</Link></div><div className="stream-grid">{channels.map(s=><StreamCard key={s.id} stream={s}/>)}</div></section>}
    <section className="browse-section"><div className="section-heading"><h2>Coming up next</h2><Link href="/schedule">Full schedule ↗</Link></div><ScheduleList compact/></section>
  </>;
}
