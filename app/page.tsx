import Link from "next/link";
import { ArrowUpRight, Radio, Users } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ReminderButton } from "@/components/reminder-button";
import { API_BASE_URL, API_CONFIGURED } from "@/lib/api";
import { demoSchedules, demoStreams, streamColors } from "@/lib/demo-data";
import type { Schedule, Stream } from "@/lib/types";

function money(value: number) { return value >= 1_000_000 ? `$${(value/1_000_000).toFixed(1)}M` : value >= 1_000 ? `$${Math.round(value/1_000)}K` : `$${Math.round(value)}`; }
function modeLabel(mode: string) { return ({ holder_rewards: "Holder Rewards", buyback_burn: "Buyback & Burn", hourly_jackpot: "Hourly Jackpot" } as Record<string,string>)[mode] ?? mode; }
function scheduleDate(value: number) { const date = new Date(value); return { day: date.toLocaleDateString("en-GB", { day: "2-digit" }), month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(), detail: date.toLocaleDateString("en-GB", { weekday: "long", hour: "numeric", minute: "2-digit" }) }; }

async function loadHome() {
  if (!API_CONFIGURED) return { streams: demoStreams, schedules: demoSchedules };
  try {
    const [streamsResponse, scheduleResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/explore?limit=12`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/schedules`, { cache: "no-store" }),
    ]);
    if (!streamsResponse.ok || !scheduleResponse.ok) throw new Error("API unavailable");
    const streams = await streamsResponse.json() as { streams: Stream[] };
    const schedules = await scheduleResponse.json() as { schedules: Schedule[] };
    return { streams: streams.streams.length ? streams.streams : demoStreams, schedules: schedules.schedules.length ? schedules.schedules : demoSchedules };
  } catch { return { streams: demoStreams, schedules: demoSchedules }; }
}

export default async function Home() {
  const { streams, schedules } = await loadHome();
  const featured = streams[0] ?? demoStreams[0]!;
  const totalViewers = streams.reduce((sum, stream) => sum + stream.viewerCount, 0);
  return <div className="app-shell">
    <AppHeader />
    <main>
      <section className="section live-section" aria-labelledby="live-heading">
        <div className="section-heading"><div><p className="eyebrow"><span className="live-pulse" /> Live from AQUA</p><h1 id="live-heading">Communities building right now</h1></div><div className="live-total"><Radio size={17} /> {totalViewers.toLocaleString()} watching across {streams.length} streams</div></div>
        <Link href={`/stream/${featured.slug}`} className="featured-stream">
          <div className="featured-visual"><div className="broadcast-grid" /><div className="featured-orb"><span>{featured.market.symbol.slice(0,1)}</span></div><span className="live-chip"><span /> LIVE</span><span className="viewer-chip"><Users size={15} /> {featured.viewerCount}</span><div className="broadcast-caption"><Radio size={15} /> {featured.market.name} is sharing their screen</div></div>
          <div className="featured-copy"><div className="coin-row"><span className="coin-dot" style={{ background: streamColors[featured.slug] ?? "#21d4e4" }}>{featured.market.symbol.slice(0,1)}</span><div><strong>{featured.market.symbol}</strong><small>{modeLabel(featured.market.rewardMode)}</small></div></div><h2>{featured.title}</h2><p>{featured.description}</p><div className="market-strip"><span><small>Market cap</small><b>{money(featured.market.marketCapUsd)}</b></span><span><small>24h</small><b className={featured.market.change24h >= 0 ? "positive" : "negative"}>{featured.market.change24h >= 0 ? "+" : ""}{featured.market.change24h.toFixed(1)}%</b></span><span><small>Holders</small><b>{featured.market.holderCount.toLocaleString()}</b></span></div><span className="watch-link">Watch stream <ArrowUpRight size={18} /></span></div>
        </Link>
        <div className="stream-grid">
          {streams.slice(1).map((stream) => <Link href={`/stream/${stream.slug}`} className="stream-card" key={stream.id}><div className="stream-thumbnail" style={{ "--stream-color": streamColors[stream.slug] ?? "#21d4e4" } as React.CSSProperties}><div className="broadcast-grid" /><span className="thumbnail-symbol">{stream.market.symbol.slice(0,1)}</span><span className="live-chip"><span /> LIVE</span><span className="viewer-chip"><Users size={14} /> {stream.viewerCount}</span></div><div className="stream-card-body"><div className="coin-row compact"><span className="coin-dot" style={{ background: streamColors[stream.slug] ?? "#21d4e4" }}>{stream.market.symbol.slice(0,1)}</span><div><strong>{stream.market.symbol}</strong><small>{stream.market.name}</small></div></div><h3>{stream.title}</h3><div className="card-stats"><span>{money(stream.market.marketCapUsd)} cap</span><b className={stream.market.change24h >= 0 ? "positive" : "negative"}>{stream.market.change24h >= 0 ? "+" : ""}{stream.market.change24h.toFixed(1)}%</b></div></div></Link>)}
        </div>
      </section>
      <section className="section upcoming-section" aria-labelledby="upcoming-heading">
        <div className="section-heading compact-heading"><div><p className="eyebrow quiet">Coming up</p><h2 id="upcoming-heading">Scheduled streams</h2></div><Link href="/schedule">View schedule <ArrowUpRight size={16} /></Link></div>
        <div className="schedule-list">{schedules.slice(0,3).map((schedule, index) => { const date=scheduleDate(schedule.scheduledFor); return <article key={schedule.id}><time dateTime={new Date(schedule.scheduledFor).toISOString()}><b>{date.day}</b><span>{date.month}</span></time><span className={`schedule-symbol ${index%2 ? "coral" : ""}`}>{schedule.symbol.slice(0,1)}</span><div><h3>{schedule.title}</h3><p>{date.detail} · {schedule.marketName}</p></div><ReminderButton scheduleId={schedule.id} /></article>; })}</div>
      </section>
    </main>
    <AppFooter />
  </div>;
}
