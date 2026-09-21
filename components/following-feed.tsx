"use client";
import Link from '@/lib/navigation';
import { useEffect, useState } from 'react';
import { useWallet } from '@/app/providers';
import { apiFetch } from '@/lib/api';
import type { Stream } from '@/lib/types';
import { StreamCard } from './stream-card';
import { FollowButton } from './follow-button';
export function FollowingFeed() {
  const { token }=useWallet(); const [streams,setStreams]=useState<Stream[]>([]); const [error,setError]=useState(''); const [loading,setLoading]=useState(true); const [retry,setRetry]=useState(0);
  useEffect(() => { if(!token)return; let active=true; const load=async()=>{try { const data=await apiFetch<{streams:Stream[]}>('/api/following',{},token); if(active){setStreams(data.streams);setError('');} }catch(e){if(active)setError((e as Error).message);}finally{if(active)setLoading(false);}}; void load(); const timer=setInterval(()=>void load(),30000);window.addEventListener('substream:follow',load);return()=>{active=false;clearInterval(timer);window.removeEventListener('substream:follow',load);};},[token,retry]);
  if(!token)return <div className="empty-state"><h2>Your followed channels</h2><p>Connect your wallet to see the coins you follow.</p></div>;
  if(error)return <div className="empty-state"><h2>Could not load your channels</h2><p>{error}</p><button className="soft-button" onClick={()=>setRetry(v=>v+1)}>Try again</button></div>;
  if(loading)return <div className="empty-state" role="status">Loading your channels…</div>;
  if(!streams.length)return <div className="empty-state"><h2>No followed channels yet</h2><p>Follow a coin from its stream page. Its channel will stay here, even when offline.</p><Link className="soft-button" href="/">Explore streams</Link></div>;
  return <div className="stream-grid">{streams.map(stream=><div key={stream.id}><StreamCard stream={stream}/><div style={{marginTop:12}}><FollowButton marketId={stream.market.id} initial/></div></div>)}</div>;
}
