import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3, Flame, Radio, TrendingUp, Users } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ChatPanel } from "@/components/chat-panel";
import { FollowButton } from "@/components/follow-button";
import { ViewerPing } from "@/components/viewer-ping";
import { API_BASE_URL, API_CONFIGURED } from "@/lib/api";
import { demoMessages, demoStream, demoStreams, streamColors } from "@/lib/demo-data";
import type { ChatMessage, Stream } from "@/lib/types";

function money(value: number) { return value >= 1_000_000 ? `$${(value/1_000_000).toFixed(2)}M` : value >= 1_000 ? `$${(value/1_000).toFixed(value<100_000?1:0)}K` : `$${value.toFixed(0)}`; }
function modeLabel(mode: string) { return ({ holder_rewards: "Holder Rewards", buyback_burn: "Buyback & Burn", hourly_jackpot: "Hourly Jackpot" } as Record<string,string>)[mode] ?? mode; }

async function loadStream(slug: string) {
  if (!API_CONFIGURED) return { stream: demoStream(slug), messages: demoMessages };
  try {
    const streamResponse = await fetch(`${API_BASE_URL}/api/streams/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (streamResponse.status === 404) return null;
    if (!streamResponse.ok) throw new Error("stream unavailable");
    const stream = await streamResponse.json() as Stream;
    const chatResponse = await fetch(`${API_BASE_URL}/api/streams/${stream.id}/chat`, { cache: "no-store" });
    const chat = chatResponse.ok ? await chatResponse.json() as { messages: Array<Record<string,unknown>> } : { messages: [] };
    const messages = chat.messages.map((message) => ({ id: Number(message.id), wallet: String(message.wallet), username: message.username ? String(message.username) : null, avatarUrl: message.avatar_url ? String(message.avatar_url) : null, body: String(message.body), role: message.role as ChatMessage["role"], createdAt: Number(message.created_at) }));
    return { stream, messages };
  } catch { return { stream: demoStream(slug), messages: demoMessages }; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const stream = demoStreams.find((item) => item.slug === slug);
  return { title: stream ? `${stream.market.symbol} live` : "Live stream", description: stream?.title ?? "Watch an AQUA community live on Sub Stream." };
}

function MarketChart({ stream }: { stream: Stream }) {
  const points = stream.chart?.length ? stream.chart : [{ time: 0, priceUsd: stream.market.priceUsd*.9, marketCapUsd: 0 },{ time: 1, priceUsd: stream.market.priceUsd, marketCapUsd: 0 }];
  const values = points.map((point) => point.priceUsd); const min=Math.min(...values); const max=Math.max(...values); const spread=max-min || 1;
  const path = points.map((point,index) => `${index ? "L" : "M"} ${(index/(points.length-1))*600} ${120-((point.priceUsd-min)/spread)*96}`).join(" ");
  return <div className="market-chart"><div className="chart-heading"><div><small>Live price</small><b>${stream.market.priceUsd.toFixed(stream.market.priceUsd<.01?5:3)}</b></div><span className={stream.market.change24h>=0?"positive":"negative"}>{stream.market.change24h>=0?"+":""}{stream.market.change24h.toFixed(1)}% today</span></div><svg viewBox="0 0 600 132" role="img" aria-label={`${stream.market.symbol} price trend`} preserveAspectRatio="none"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#21d4e4" stopOpacity=".26"/><stop offset="1" stopColor="#21d4e4" stopOpacity="0"/></linearGradient></defs><path d={`${path} L 600 132 L 0 132 Z`} fill="url(#chart-fill)"/><path d={path} fill="none" stroke="#21d4e4" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg></div>;
}

export default async function StreamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const loaded = await loadStream(slug); if (!loaded) notFound();
  const { stream, messages } = loaded; const color=streamColors[stream.slug] ?? "#21d4e4";
  return <div className="app-shell"><AppHeader /><ViewerPing streamId={stream.id} />
    <main className="watch-page">
      <div className="watch-topbar"><Link href="/"><ArrowLeft size={17}/> Back to live streams</Link><div><span className="live-pulse" /> {stream.status === "live" ? "Live" : stream.status}</div></div>
      <div className="watch-grid">
        <section className="player-column">
          <div className="video-player">
            {stream.provider === "cloudflare" && stream.playerUrl ? <iframe src={stream.playerUrl} title={`${stream.market.symbol} live stream`} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <div className="demo-broadcast"><div className="broadcast-grid"/><Image src="/sub-stream-mark.png" width={150} height={150} alt=""/><div className="sound-bars" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><p>{stream.market.name} is live</p></div>}
            <span className="live-chip"><span/> LIVE</span><span className="viewer-chip"><Users size={14}/> {stream.viewerCount}</span>
          </div>
          <div className="stream-info-row"><div className="coin-row"><span className="coin-dot" style={{background:color}}>{stream.market.symbol.slice(0,1)}</span><div><strong>{stream.market.symbol}</strong><small>{stream.market.name}</small></div></div><div className="stream-title"><h1>{stream.title}</h1><p>{stream.category} · {modeLabel(stream.market.rewardMode)}</p></div><FollowButton marketId={stream.market.id} initial={stream.followed}/></div>
          {stream.announcement && <div className="stream-announcement"><Radio size={17}/><div><b>Creator announcement</b><p>{stream.announcement}</p></div></div>}
        </section>
        <ChatPanel streamId={stream.id} initialMessages={messages}/>
      </div>

      <div className="below-stream-grid">
        <section className="market-panel"><div className="market-panel-heading"><div><p className="eyebrow quiet">Market</p><h2>{stream.market.symbol} at a glance</h2></div><a href={stream.market.aquaUrl} target="_blank" rel="noreferrer">View on AQUA <ArrowUpRight size={16}/></a></div><MarketChart stream={stream}/><div className="market-metrics"><span><small>Market cap</small><b>{money(stream.market.marketCapUsd)}</b></span><span><small>24h volume</small><b>{money(stream.market.volume24hUsd)}</b></span><span><small>Holders</small><b>{stream.market.holderCount.toLocaleString()}</b></span><span><small>Mode</small><b>{modeLabel(stream.market.rewardMode)}</b></span></div></section>
        <aside className="activity-panel"><div className="market-panel-heading"><div><p className="eyebrow quiet">On-chain</p><h2>Market activity</h2></div></div><div className="activity-list"><article><span className="activity-icon buy"><TrendingUp size={17}/></span><div><b>Large buy</b><p>18.4 SOL of {stream.market.symbol}</p></div><time><Clock3 size={13}/> 2m</time></article><article><span className="activity-icon reward"><Radio size={17}/></span><div><b>Holder rewards funded</b><p>$428 added to the next round</p></div><time><Clock3 size={13}/> 14m</time></article><article><span className="activity-icon burn"><Flame size={17}/></span><div><b>Tokens burned</b><p>24.1K {stream.market.symbol}</p></div><time><Clock3 size={13}/> 31m</time></article></div></aside>
      </div>
      <section className="stream-about"><p className="eyebrow quiet">About this stream</p><h2>{stream.title}</h2><p>{stream.description}</p><div><span>Hosted by <b>{stream.market.name}</b></span><span>{(stream.followerCount ?? 0).toLocaleString()} followers</span></div></section>
    </main><AppFooter /></div>;
}
