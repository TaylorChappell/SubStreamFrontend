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
  return <><div className="page-title-row"><div><p className="kicker">THE AQUA COMMUNITY, LIVE</p><h1>Find your people.</h1></div><Link className="text-link" href="/channels">Explore all channels ↗</Link></div>
    <section className="browse-hero"><div className="hero-copy"><span className="hero-label"><i/>A place to come together</span><h2>Less scrolling.<br/>More <em>connecting.</em></h2><p>Live conversations, late-night builds and the people behind your coins.</p><div><Link className="white-button" href="/go-live">Start your stream <span>↗</span></Link><Link className="hero-secondary" href="/studio">Creator studio</Link></div></div><div className="hero-art" aria-hidden="true"><div className="hero-waterlines"><i/><i/><i/><i/></div><img src={assetUrl('sub-stream-logo.png')} alt=""/><span>Go with the stream.</span></div></section>
    <section className="browse-section"><div className="section-heading"><div><h2>Find your kind of stream</h2><p>Pick a category. Drop into a conversation.</p></div><Link href="/categories">All categories ↗</Link></div><CategoryCards/></section>
    <section className="browse-section"><div className="section-heading"><h2><span className="live-heading-dot"/>Live now</h2><button className="text-link" onClick={()=>{setLoading(true);setRetry(v=>v+1);}} disabled={loading}>{loading?'Updating…':'Refresh'}</button></div>
    {error?<div className="empty-state" role="alert"><h3>Streams are unavailable</h3><p>{error}</p><button className="soft-button" onClick={()=>setRetry(v=>v+1)}>Try again</button></div>:loading&&!streams.length?<div className="stream-skeletons" aria-label="Loading streams">{[1,2,3].map(n=><div key={n}/>)}</div>:streams.length?<div className="stream-grid">{streams.map(s=><StreamCard key={s.id} stream={s}/>)}</div>:<div className="quiet-empty"><div><span className="small-label">A QUIET MOMENT</span><h3>The next conversation could be yours.</h3><p>No channels are live right now. Start a stream or find a community to follow.</p></div><Link className="primary-action" href="/go-live">Go Live</Link></div>}
    {more&&limit<48&&<button className="soft-button load-more" onClick={()=>setLimit(v=>v+12)}>Show more streams</button>}</section>
    {channels.length>0&&<section className="browse-section"><div className="section-heading"><div><h2>Keep up with your communities</h2><p>Offline now. Always worth following.</p></div><Link href="/channels">All channels ↗</Link></div><div className="stream-grid">{channels.map(s=><StreamCard key={s.id} stream={s}/>)}</div></section>}
    <section className="browse-section"><div className="section-heading"><h2>Coming up next</h2><Link href="/schedule">Full schedule ↗</Link></div><ScheduleList compact/></section>
  </>;
}
