"use client";

import Link from '@/lib/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Clipboard, Eye, KeyRound, LoaderCircle, Radio, RefreshCw, Satellite, ShieldCheck, Sparkles, Square, Video } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { StudioManagement } from "./studio-management";

interface CreatorMarket {
  id: string;
  name: string;
  symbol: string;
  mint: string;
  imageUrl?: string | null;
  marketCapUsd: number;
  priceUsd: number;
  aquaUrl: string;
  streamId?: string | null;
  streamStatus?: string | null;
  streamTitle?: string | null;
  slug?: string | null;
  viewerCount?: number;
}

interface CreatorChannel {
  id: string;
  marketId: string;
  marketName: string;
  symbol: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: "offline" | "scheduled" | "live" | "errored";
  viewerCount: number;
  lastError?: string | null;
}

interface Credentials { server: string; streamKey: string; }


function mapMarket(row: Record<string, unknown>): CreatorMarket {
  return {
    id: String(row.id), name: String(row.name), symbol: String(row.symbol), mint: String(row.mint),
    imageUrl: row.image_url ? String(row.image_url) : null,
    marketCapUsd: Number(row.market_cap_usd ?? 0), priceUsd: Number(row.price_usd ?? 0), aquaUrl: String(row.aqua_url ?? "#"),
    streamId: row.stream_id ? String(row.stream_id) : null, streamStatus: row.stream_status ? String(row.stream_status) : null,
    streamTitle: row.stream_title ? String(row.stream_title) : null, slug: row.slug ? String(row.slug) : null, viewerCount: Number(row.viewer_count ?? 0),
  };
}

function mapChannel(row: Record<string, unknown>): CreatorChannel {
  return {
    id: String(row.id), marketId: String(row.market_id), marketName: String(row.market_name), symbol: String(row.symbol), slug: String(row.slug),
    title: String(row.title), description: String(row.description ?? ""), category: String(row.category ?? "Community"),
    status: row.status as CreatorChannel["status"], viewerCount: Number(row.viewer_count ?? 0), lastError: row.last_error ? String(row.last_error) : null,
  };
}

function money(value: number) { return value >= 1000 ? `$${Math.round(value / 1000)}K` : `$${Math.round(value)}`; }
function shortMint(value: string) { return `${value.slice(0, 5)}…${value.slice(-5)}`; }

export function CreatorStudio() {
  const { connected, wallet, token } = useWallet();
  const [markets, setMarkets] = useState<CreatorMarket[]>([]);
  const [channels, setChannels] = useState<CreatorChannel[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError,setLoadError]=useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [credentialsVisible, setCredentialsVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Community");
  const [announcement, setAnnouncement] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  useEffect(() => { setCredentials(null); setCredentialsVisible(false); }, [token]);

  const load = useCallback(async () => {
    if (!connected || !token) { setMarkets([]); setChannels([]); setCredentials(null); return; }
    setLoading(true);
    try {
      const [marketResponse, streamResponse] = await Promise.all([
        apiFetch<{ markets: Array<Record<string, unknown>> }>("/api/creator/markets", {}, token),
        apiFetch<{ streams: Array<Record<string, unknown>> }>("/api/creator/streams", {}, token),
      ]);
      const nextMarkets = marketResponse.markets.map(mapMarket);
      const nextChannels = streamResponse.streams.map(mapChannel);
      setMarkets(nextMarkets); setChannels(nextChannels); setLoadError("");
      setSelectedId(current => nextChannels.some(c => c.id === current) ? current : nextChannels[0]?.id ?? "");
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Could not load creator studio"); }
    finally { setLoading(false); }
  }, [connected, token]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void load(); });
    const timer = setInterval(() => { if (active) void load(); }, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [load]);

  const selected = useMemo(() => channels.find((channel) => channel.id === selectedId) ?? channels[0] ?? null, [channels, selectedId]);
  useEffect(() => {
    if (!selected) return;
    const channel = selected;
    queueMicrotask(() => { setTitle(channel.title); setDescription(channel.description); setCategory(channel.category); setCredentials(null); setCredentialsVisible(false); });
  }, [selected?.id]);

  const requireWallet = () => {
    if (connected) return true;
    toast.error("Connect the creator wallet to manage a channel.");
    return false;
  };

  const createChannel = async (market: CreatorMarket) => {
    if (!requireWallet()) return;
    setSaving(true);
    try {
      {
        const response = await apiFetch<{ stream: { id: string; slug: string; title: string; status: CreatorChannel["status"] } }>("/api/creator/streams", { method: "POST", body: JSON.stringify({ marketId: market.id, title: `${market.symbol} community live`, description: `Live updates and holder questions from ${market.name}.`, category: "Community" }) }, token);
        await load(); setSelectedId(response.stream.id);
      }
      toast.success("Channel created. Your private broadcast key is ready.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create channel"); }
    finally { setSaving(false); }
  };

  const saveChannel = async (event: FormEvent) => {
    event.preventDefault(); if (!selected || !requireWallet()) return; setSaving(true);
    try {
      await apiFetch(`/api/creator/streams/${selected.id}`, { method: "PATCH", body: JSON.stringify({ title, description, category }) }, token);
      setChannels((items) => items.map((item) => item.id === selected.id ? { ...item, title, description, category } : item));
      toast.success("Channel details saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save channel"); }
    finally { setSaving(false); }
  };

  const revealCredentials = async () => {
    if (!selected || !requireWallet()) return; setSaving(true);
    try {
      const next = (await apiFetch<{ credentials: Credentials }>(`/api/creator/streams/${selected.id}/credentials`, {}, token)).credentials;
      setCredentials(next); setCredentialsVisible(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load broadcast key"); }
    finally { setSaving(false); }
  };

  const rotateKey = async () => {
    if (!selected || !requireWallet()) return; if (!window.confirm("Rotate this stream key? OBS will disconnect and the old key will stop working.")) return; setSaving(true);
    try {
      const next = (await apiFetch<{ credentials: Credentials }>(`/api/creator/streams/${selected.id}/rotate-key`, { method: "POST" }, token)).credentials;
      setCredentials(next); setCredentialsVisible(true); toast.success("Stream key rotated. Update OBS before going live.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not rotate stream key"); }
    finally { setSaving(false); }
  };

  const publishAnnouncement = async () => {
    if (!selected || !announcement.trim() || !requireWallet()) return;
    try {
      await apiFetch(`/api/creator/streams/${selected.id}/announcement`, { method: "PUT", body: JSON.stringify({ body: announcement.trim() }) }, token);
      toast.success("Announcement published to the live room");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not publish announcement"); }
  };

  const scheduleStream = async () => {
    if (!selected || !scheduleAt || !requireWallet()) return toast.error("Choose a future date and time.");
    const scheduledFor = new Date(scheduleAt).getTime();
    if (!Number.isFinite(scheduledFor) || scheduledFor < Date.now() + 5 * 60_000) return toast.error("Schedule at least five minutes from now.");
    try {
      await apiFetch("/api/creator/schedules", { method: "POST", body: JSON.stringify({ marketId: selected.marketId, streamId: selected.id, title: selected.title, description: selected.description, scheduledFor, durationMinutes: 60 }) }, token);
      toast.success("Stream added to the public schedule"); setScheduleAt("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not schedule stream"); }
  };

  const endStream = async () => {
    if (!selected || !requireWallet()) return;
    if (!window.confirm("End this broadcast? Stop OBS before enabling it again.")) return;
    try {
      await apiFetch(`/api/creator/streams/${selected.id}/end`, { method: "POST" }, token);
      setChannels((items) => items.map((item) => item.id === selected.id ? { ...item, status: "offline", viewerCount: 0 } : item)); toast.success("Broadcast ended");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not end broadcast"); }
  };

  const copy = async (value: string, label: string) => { await navigator.clipboard.writeText(value); toast.success(`${label} copied`); };

  return <div className="studio-layout">
    <aside className="studio-sidebar">
      <div className="studio-sidebar-heading"><div><p className="eyebrow quiet">Your AQUA coins</p><h2>Channels</h2></div>{loading && <LoaderCircle className="spin" size={18} />}</div>
      <div className="channel-list">
        {channels.map((channel) => <button type="button" key={channel.id} className={selected?.id === channel.id ? "active" : ""} onClick={() => setSelectedId(channel.id)}><span className="schedule-symbol">{channel.symbol.slice(0, 1)}</span><span><b>{channel.symbol}</b><small>{channel.title}</small></span><i className={channel.status}>{channel.status}</i></button>)}
        {!channels.length && <p className="empty-copy">No channels yet. Choose a verified coin below.</p>}
      </div>
      <div className="unclaimed-list"><p>Ready for a channel</p>{markets.filter((market) => !channels.some((channel) => channel.marketId === market.id)).map((market) => <div key={market.id}><span><b>{market.symbol}</b><small>{money(market.marketCapUsd)} market cap</small></span><button type="button" disabled={saving} onClick={() => void createChannel(market)}>Create</button></div>)}</div>
      <div className="verification-note"><ShieldCheck size={18} /><p><b>Creator-verified</b><br />Channels can only be created by the wallet recorded by AQUA.</p></div>
    </aside>

    <section className="studio-workspace">{loadError && <div className="schedule-empty" role="alert"><p>{loadError}</p><button className="soft-button" onClick={() => void load()}>Try again</button></div>}
      {!connected && <div className="studio-gate"><div><p className="eyebrow">Creator access</p><h1>Connect the wallet that launched your coin.</h1><p>Sub Stream checks the creator address imported from AQUA before it exposes keys, schedules, or moderation controls.</p></div><span><KeyRound size={26} /> Use the wallet button above to sign in</span></div>}
      {connected && selected ? <>
        <div className="studio-hero"><div><div className="studio-status"><span className={`status-dot ${selected.status}`} /> {selected.status === "live" ? `${selected.viewerCount} watching now` : "Channel offline"}</div><h1>{selected.symbol} creator studio</h1><p>{selected.title}</p></div><div className="studio-hero-actions">{selected.status === "live" && <Link href={`/stream/${selected.slug}`}><Eye size={17} /> View live room</Link>}<button type="button" onClick={() => void revealCredentials()} disabled={saving || !connected}><Satellite size={17} /> Broadcast setup</button>{selected.status === "live" && <button className="danger" type="button" onClick={() => void endStream()}><Square size={15} /> End stream</button>}</div></div>

        <div className="studio-metrics"><article><small>Status</small><b>{selected.status}</b><span>Updates automatically from the ingest provider</span></article><article><small>Live viewers</small><b>{selected.viewerCount}</b><span>Active sessions in the last 45 seconds</span></article><article><small>Chat access</small><b>Holders only</b><span>Balances rechecked every 60 seconds</span></article></div>

        <div className="studio-grid">
          <form className="studio-card" onSubmit={saveChannel}><div className="studio-card-heading"><span><Video size={18} /></span><div><h2>Channel details</h2><p>What viewers see on Explore and in your live room.</p></div></div><label>Stream title<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={100} required /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} /></label><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Community</option><option>Development</option><option>AMA</option><option>Art</option><option>Gaming</option><option>Education</option></select></label><button className="primary-action" type="submit" disabled={saving || !connected}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Save details</button></form>

          <div className="studio-card"><div className="studio-card-heading"><span><Radio size={18} /></span><div><h2>Broadcast key</h2><p>Paste these values into OBS or Streamlabs.</p></div></div>{credentials ? <div className="credentials"><label>Server<div><input readOnly value={credentials.server} /><button type="button" aria-label="Copy server" onClick={() => void copy(credentials.server, "Server")}><Clipboard size={16} /></button></div></label><label>Stream key<div><input readOnly type={credentialsVisible ? "text" : "password"} value={credentials.streamKey} /><button type="button" aria-label="Copy stream key" onClick={() => void copy(credentials.streamKey, "Stream key")}><Clipboard size={16} /></button></div></label><p>Keep this key private. Anyone with it can broadcast to your channel.</p><div className="inline-actions"><button type="button" onClick={() => setCredentialsVisible((value) => !value)}><Eye size={15} /> {credentialsVisible ? "Hide key" : "Show key"}</button><button type="button" onClick={() => void rotateKey()} disabled={saving}><RefreshCw size={15} /> Rotate key</button></div></div> : <div className="credential-empty"><KeyRound size={28} /><p>Credentials stay hidden until you request them from an authenticated creator session.</p><button type="button" onClick={() => void revealCredentials()} disabled={saving || !connected}>Reveal credentials</button></div>}</div>

          <div className="studio-card"><div className="studio-card-heading"><span><Sparkles size={18} /></span><div><h2>Live announcement</h2><p>Pin an update above chat for everyone watching.</p></div></div><label>Message<textarea rows={4} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} maxLength={280} /></label><div className="character-count">{announcement.length}/280</div><button className="primary-action secondary" type="button" disabled={!connected || !announcement.trim()} onClick={() => void publishAnnouncement()}>Publish announcement</button></div>

          <div className="studio-card"><div className="studio-card-heading"><span><CalendarPlus size={18} /></span><div><h2>Schedule the next stream</h2><p>Appear on the public calendar before you go live.</p></div></div><label>Date and time<input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} /></label><div className="schedule-preview"><CalendarPlus size={20} /><span><b>{scheduleAt ? new Date(scheduleAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Choose a time"}</b><small>Default duration: 60 minutes</small></span></div><button className="primary-action secondary" type="button" disabled={!connected || !scheduleAt} onClick={() => void scheduleStream()}>Add to schedule</button></div>
        </div>
        <StudioManagement streamId={selected.id} token={token!} onRefresh={load}/>
      </> : connected && <div className="studio-empty"><Video size={34} /><h1>Create your first channel</h1><p>No channels found. Coins launched by this wallet appear on the left after the next AQUA sync.</p></div>}
      <div className="studio-footnote"><span>Signed in as</span><code>{wallet ? shortMint(wallet) : "wallet not connected"}</code>{connected && <span>· Authenticated API session</span>}</div>
    </section>
  </div>;
}
