import { useState } from 'react';
import Link from '@/lib/navigation';
import { categoryLabel,relativeTime,CATEGORIES } from '@/lib/categories';
import type { Stream } from '@/lib/types';
import { CoinAvatar } from './coin-avatar';
export function StreamCard({stream}:{stream:Stream}) {
  const [failed,setFailed]=useState(false);const live=stream.status==='live';
  const category=CATEGORIES.find(c=>c.name===stream.category)?.id||'community';
  return <Link href={`/stream/${stream.slug}`} className={`stream-card ${live?'is-live':''}`}><div className={`stream-thumbnail category-${category}`}>
    {stream.thumbnailUrl&&!failed?<img src={stream.thumbnailUrl} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<div className="channel-cover"><span>{stream.market.symbol}</span><small>{stream.market.name}</small><div className="cover-rings"/></div>}
    <span className={live?'live-chip':'offline-chip'}>{live?'LIVE':'OFFLINE'}</span><span className="viewer-chip">{live?`${stream.viewerCount} watching`:stream.lastLiveAt?`Last live ${relativeTime(stream.lastLiveAt)}`:'No broadcasts yet'}</span><span className="thumbnail-open">{live?'Join stream':'Visit channel'} ↗</span>
  </div><div className="stream-card-body"><CoinAvatar symbol={stream.market.symbol} src={stream.market.imageUrl}/><div><h3>{stream.title}</h3><p>{stream.market.name} <span>· {stream.market.symbol}</span></p><small>{categoryLabel(stream.category)}</small></div></div></Link>;
}
