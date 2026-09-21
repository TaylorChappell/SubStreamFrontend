import Link from '@/lib/navigation';
import { useEffect,useState } from 'react';
import { toast } from 'sonner';
import { apiFetch,ApiError } from '@/lib/api';
import type { Stream } from '@/lib/types';
import { categoryLabel,CATEGORIES,relativeTime } from '@/lib/categories';
import { useWallet } from '@/app/providers';
import { ChatPanel } from './chat-panel';
import { FollowButton } from './follow-button';
import { ViewerPing } from './viewer-ping';
import { ReportDialog } from './report-dialog';
import { CoinAvatar } from './coin-avatar';
import { BroadcastHistory } from './broadcast-history';
const money=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(value);
function Chart({stream}:{stream:Stream}) {
  const points=stream.chart??[],values=points.map(p=>p.priceUsd),min=Math.min(...values),max=Math.max(...values),spread=max-min;
  const path=points.map((p,i)=>`${i?'L':'M'} ${i/Math.max(points.length-1,1)*600} ${spread?110-(p.priceUsd-min)/spread*90:65}`).join(' ');
  return <div className="market-chart"><div className="chart-heading"><div><small>Market price</small><b>{stream.market.priceUsd.toLocaleString('en-US',{style:'currency',currency:'USD',maximumSignificantDigits:5})}</b></div><span className={stream.market.change24h>=0?'positive':'negative'}>{stream.market.change24h>0?'+':''}{stream.market.change24h.toFixed(2)}% / 24h</span></div>{points.length>=2?<svg viewBox="0 0 600 132" role="img" aria-label="Price history from AQUA snapshots"><path d={path} fill="none" stroke="#138aca" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>:<p className="field-hint">Price history appears after two market snapshots.</p>}</div>;
}
export function StreamRoom({slug}:{slug:string}) {
  const {token,wallet}=useWallet();const [stream,setStream]=useState<Stream|null>(null),[error,setError]=useState(''),[missing,setMissing]=useState(false),[retry,setRetry]=useState(0),[tab,setTab]=useState('About'),[busy,setBusy]=useState(false);
  useEffect(()=>{const c=new AbortController();setStream(null);setError('');setMissing(false);let running=false;const load=async()=>{if(running)return;running=true;try{const result=await apiFetch<Stream>('/api/streams/'+encodeURIComponent(slug),{signal:c.signal},token);if(!c.signal.aborted){setStream(result);setError('');}}catch(e){if(!c.signal.aborted){setError((e as Error).message);setMissing(e instanceof ApiError&&e.status===404);}}finally{running=false;}};void load();const timer=setInterval(()=>void load(),5000);return()=>{c.abort();clearInterval(timer);};},[slug,token,retry]);
  if(!stream)return <main className="browse-page"><div className="empty-state"><h1>{missing?'Channel not found':error?'Could not load this channel':'Loading channel…'}</h1>{error&&<p>{error}</p>}{!missing&&error&&<button className="soft-button" onClick={()=>setRetry(v=>v+1)}>Try again</button>}<Link href="/">Back to Browse</Link></div></main>;
  const owner=wallet===stream.market.creatorWallet,live=stream.status==='live';
  const category=CATEGORIES.find(c=>c.name===stream.category);
  async function end(){if(!stream||!window.confirm('End this broadcast? Viewers will see your channel as offline.'))return;setBusy(true);try{await apiFetch(`/api/creator/streams/${stream.id}/end`,{method:'POST'},token);setStream({...stream,status:'offline'});toast.success('Broadcast ended. Stop streaming in OBS too.');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}
  return <main className="watch-page">{live&&<ViewerPing streamId={stream.id}/>}<div className="watch-topbar"><Link href="/channels">← All channels</Link><span>{live?'Live now':stream.status==='errored'?'Broadcast interrupted':stream.lastLiveAt?`Last live ${relativeTime(stream.lastLiveAt)}`:'Offline'}</span></div>
    {owner&&<div className="owner-toolbar"><span><b>{live?'You’re live.':stream.status==='errored'?'Check your broadcast.':'Ready when you are.'}</b> {live?'Your community can watch below.':'Start streaming in OBS. This page updates when your video arrives.'}</span><Link href={`/go-live/${encodeURIComponent(stream.market.id)}`}>Stream setup & keys</Link>{live&&<button className="danger-button" disabled={busy} onClick={()=>void end()}>{busy?'Ending…':'End stream'}</button>}</div>}
    {error&&<p role="status" className="form-error">Updates paused: {error}</p>}
    <div className="watch-grid"><section className="player-column"><div className={`video-player ${!live?'is-offline':''}`}>
      {live&&stream.provider==='cloudflare'&&stream.playerUrl?<iframe src={stream.playerUrl} title={stream.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<div className="offline-player"><div className="offline-water" aria-hidden="true"/><CoinAvatar symbol={stream.market.symbol} src={stream.market.imageUrl} size="large"/><span className="small-label">{stream.market.name}</span><h2>{stream.status==='errored'?'We’ll be right back.':owner?'Waiting for your broadcast.':'Between streams.'}</h2><p>{owner?'Send your video from OBS to bring this channel online.':`${stream.market.symbol} is offline. Follow the channel to keep it in your feed.`}</p>{!owner&&<Link className="white-button" href="/schedule">See what’s coming up ↗</Link>}</div>}
      {live&&<><span className="live-chip">LIVE</span><span className="viewer-chip">{stream.viewerCount} watching</span></>}
    </div><div className="stream-info-row"><CoinAvatar symbol={stream.market.symbol} src={stream.market.imageUrl} size="large"/><div className="stream-title"><span>{stream.market.name} <small>{stream.market.symbol}</small></span><h1>{stream.title}</h1><Link href={category?`/category/${category.id}`:'/categories'}>{categoryLabel(stream.category)}</Link></div><FollowButton marketId={stream.market.id} initial={stream.followed}/></div>{stream.announcement&&<div className="stream-announcement"><b>From the creator</b><p>{stream.announcement}</p></div>}
    <nav className="room-tabs" aria-label="Channel information">{['About','Past broadcasts','Coin'].map(t=><button key={t} className={tab===t?'active':''} aria-current={tab===t?'page':undefined} onClick={()=>setTab(t)}>{t}</button>)}<span>{stream.followerCount??0} followers</span></nav><div className="room-tab-content" key={tab}>
      {tab==='About'&&<section className="stream-about"><h2>About {stream.market.name}</h2><p>{stream.description||'The creator has not added a description yet.'}</p><div><span>{stream.lastLiveAt?`Last streamed ${relativeTime(stream.lastLiveAt)}`:'No broadcasts yet'}</span><ReportDialog streamId={stream.id}/></div></section>}
      {tab==='Past broadcasts'&&<BroadcastHistory slug={slug}/>}
      {tab==='Coin'&&<section className="market-panel"><div className="section-heading"><h2>{stream.market.symbol}</h2><a href={stream.market.aquaUrl} target="_blank" rel="noreferrer">View on AQUA ↗</a></div><Chart stream={stream}/><div className="market-metrics"><span><small>Market cap</small><b>{money(stream.market.marketCapUsd)}</b></span><span><small>24h volume</small><b>{money(stream.market.volume24hUsd)}</b></span><span><small>Holders</small><b>{stream.market.holderCount.toLocaleString()}</b></span><span><small>Reward mode</small><b>{stream.market.rewardMode.replaceAll('_',' ')}</b></span></div><p className="field-hint">Market data refreshes approximately every five minutes.</p></section>}
    </div></section><ChatPanel streamId={stream.id} initialMessages={[]}/></div>
  </main>;
}
