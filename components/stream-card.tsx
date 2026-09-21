import Link from 'next/link';
import { Users, Video } from 'lucide-react';
import type { Stream } from '@/lib/types';
export function StreamCard({ stream }: { stream: Stream }) {
  return <Link href={`/stream/${stream.slug}`} className="stream-card"><div className="stream-thumbnail">{stream.thumbnailUrl ? <img src={stream.thumbnailUrl} alt=""/> : <div className="thumbnail-placeholder"><Video size={28}/><span>{stream.market.name}</span></div>}{stream.status === 'live' && <><span className="live-chip">LIVE</span><span className="viewer-chip"><Users size={14}/>{stream.viewerCount}</span></>}</div><div className="stream-card-body"><div className="coin-row compact">{stream.market.imageUrl ? <img className="coin-dot" src={stream.market.imageUrl} alt=""/> : <span className="coin-dot">{stream.market.symbol.slice(0,1)}</span>}<div><strong>{stream.market.symbol}</strong><small>{stream.market.name} · {stream.category}</small></div></div><h3>{stream.title}</h3><div className="card-stats"><span>{stream.status === 'live' ? 'Live now' : 'Offline'}</span><span>{stream.market.rewardMode.replaceAll('_', ' ')}</span></div></div></Link>;
}
