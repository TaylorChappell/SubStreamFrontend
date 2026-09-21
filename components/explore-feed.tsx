"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Radio, Search, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Stream } from '@/lib/types';
import { StreamCard } from './stream-card';
import { ScheduleList } from './schedule-list';
export function ExploreFeed() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [q, setQ] = useState(''); const [category, setCategory] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0); const [limit, setLimit] = useState(12); const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try { const result = await apiFetch<{ streams: Stream[]; hasMore: boolean }>(`/api/explore?limit=${limit}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setStreams(result.streams); setHasMore(result.hasMore); setError(''); }
      } catch (e) { if (!controller.signal.aborted) setError((e as Error).message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    const delay = setTimeout(() => void load(), 250); const poll = setInterval(() => void load(), 30000);
    return () => { controller.abort(); clearTimeout(delay); clearInterval(poll); };
  }, [q, category, revision, limit]);
  return <>
    <div className="explore-heading"><div><p className="eyebrow quiet">AQUA communities</p><h1>Live streams</h1><p>Catch up with the people behind your coins.</p></div><Link className="primary-action" href="/studio">Open creator studio</Link></div>
    <div className="discovery-bar"><div className="category-tabs" aria-label="Stream categories">{['', 'Community', 'Development', 'AMA', 'Gaming', 'Art', 'Education'].map(value => <button key={value} aria-pressed={category === value} onClick={() => { setCategory(value); setLimit(12); }}>{value || 'All streams'}</button>)}</div><label className="feed-search"><Search size={17}/><span className="sr-only">Search live streams</span><input placeholder="Coin or stream" value={q} onChange={event => { setQ(event.target.value); setLimit(12); }}/></label></div>
    <div className="feed-count"><span>{!error && !loading ? `${streams.length}${hasMore ? '+' : ''} live ${streams.length === 1 ? 'stream' : 'streams'}` : 'Live now'}</span><button onClick={() => setRevision(value => value + 1)} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''}/> Refresh</button></div>
    {error ? <div className="empty-state" role="status"><Radio size={28}/><h2>Streams are unavailable</h2><p>{error}</p><button className="soft-button" onClick={() => setRevision(value => value + 1)}>Try again</button></div> : loading && !streams.length ? <div className="empty-state" role="status"><p>Loading live streams…</p></div> : !streams.length ? <div className="empty-state"><Radio size={28}/><h2>{q || category ? 'No matching streams' : 'No one is live right now'}</h2><p>{q || category ? 'Try another coin or category.' : 'Upcoming broadcasts appear below. If you launched a coin on AQUA, you can create its channel in the studio.'}</p>{q || category ? <button className="soft-button" onClick={() => { setQ(''); setCategory(''); }}>Clear filters</button> : <Link className="soft-button" href="/studio">Create a channel</Link>}</div> : <div className="stream-grid">{streams.map(stream => <StreamCard key={stream.id} stream={stream}/>)}</div>}
    {hasMore && limit < 48 && !error && <button className="soft-button load-more" onClick={() => setLimit(value => Math.min(48, value + 12))}>Show more streams</button>}
    <section className="upcoming-section"><div className="section-heading compact-heading"><h2>Coming up</h2><Link href="/schedule">Full schedule</Link></div><ScheduleList compact/></section>
  </>;
}
