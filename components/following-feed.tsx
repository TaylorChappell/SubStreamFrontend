"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Bell, LoaderCircle, Radio, Users } from "lucide-react";
import { useWallet } from "@/app/providers";
import { FollowButton } from "@/components/follow-button";
import { apiFetch, API_CONFIGURED } from "@/lib/api";
import { demoStreams, streamColors } from "@/lib/demo-data";
import type { Stream } from "@/lib/types";

export function FollowingFeed() {
  const { connected, token } = useWallet();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!connected) { setStreams([]); return; }
    setLoading(true);
    try {
      if (API_CONFIGURED) setStreams((await apiFetch<{ streams: Stream[] }>("/api/following", {}, token)).streams);
      else setStreams(demoStreams.filter((stream) => localStorage.getItem(`substream.follow.${stream.market.id}`) === "1"));
    } catch { setStreams([]); }
    finally { setLoading(false); }
  }, [connected, token]);

  useEffect(() => {
    let active = true;
    const refresh = () => { if (active) void load(); };
    queueMicrotask(refresh);
    window.addEventListener("substream:follow", refresh);
    return () => { active = false; window.removeEventListener("substream:follow", refresh); };
  }, [load]);

  if (!connected) return <div className="following-gate"><Bell size={34} /><h2>Your favorite communities, one click away.</h2><p>Connect a wallet, then follow any AQUA coin to build a personal live feed.</p><span>Use <b>Connect wallet</b> in the top-right to get started.</span></div>;
  if (loading) return <div className="following-gate"><LoaderCircle className="spin" size={30} /><p>Loading your channels…</p></div>;
  if (!streams.length) return <div className="following-gate"><Radio size={34} /><h2>Nothing followed yet.</h2><p>Follow a live coin and it will appear here whenever the creator starts streaming.</p><Link href="/">Explore live streams <ArrowUpRight size={17} /></Link></div>;

  return <div className="following-grid">{streams.map((stream) => <article className="following-card" key={stream.id}><Link href={`/stream/${stream.slug}`}><div className="stream-thumbnail" style={{ "--stream-color": streamColors[stream.slug] ?? "#21d4e4" } as React.CSSProperties}><div className="broadcast-grid" /><span className="thumbnail-symbol">{stream.market.symbol.slice(0,1)}</span>{stream.status === "live" && <span className="live-chip"><span /> LIVE</span>}<span className="viewer-chip"><Users size={14} /> {stream.viewerCount}</span></div></Link><div><div className="coin-row compact"><span className="coin-dot" style={{ background: streamColors[stream.slug] ?? "#21d4e4" }}>{stream.market.symbol.slice(0,1)}</span><span><strong>{stream.market.symbol}</strong><small>{stream.market.name}</small></span></div><h2><Link href={`/stream/${stream.slug}`}>{stream.title}</Link></h2><p>{stream.description}</p><FollowButton marketId={stream.market.id} initial /></div></article>)}</div>;
}
