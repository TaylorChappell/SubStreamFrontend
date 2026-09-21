import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { ReminderButton } from "@/components/reminder-button";
import { API_BASE_URL, API_CONFIGURED } from "@/lib/api";
import { demoSchedules } from "@/lib/demo-data";
import type { Schedule } from "@/lib/types";

export const metadata: Metadata = { title: "Stream schedule", description: "Upcoming live streams from AQUA creators." };

async function loadSchedules() {
  if (!API_CONFIGURED) return demoSchedules;
  try { const response = await fetch(`${API_BASE_URL}/api/schedules`, { cache: "no-store" }); if (!response.ok) throw new Error(); return ((await response.json()) as { schedules: Schedule[] }).schedules; }
  catch { return demoSchedules; }
}

export default async function SchedulePage() {
  const schedules = await loadSchedules();
  const groups = Map.groupBy(schedules, (item) => new Date(item.scheduledFor).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  return <div className="app-shell"><AppHeader /><main className="simple-page"><div className="page-heading schedule-page-heading"><div><p className="eyebrow">Plan ahead</p><h1>Stream schedule</h1><p>Set a reminder and meet your community when they go live.</p></div><span><CalendarDays size={20} /> All times shown in your local timezone</span></div><div className="calendar-groups">{Array.from(groups.entries()).map(([date, items]) => <section key={date}><h2>{date}</h2><div>{items.map((item) => { const time = new Date(item.scheduledFor); return <article key={item.id}><time dateTime={time.toISOString()}><b>{time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</b><small><Clock3 size={12} /> {item.durationMinutes} min</small></time><span className="schedule-symbol">{item.symbol.slice(0,1)}</span><div><p>{item.symbol} · {item.marketName}</p><h3>{item.title}</h3><span>{item.description}</span></div>{item.slug ? <Link href={`/stream/${item.slug}`}>Channel <ArrowUpRight size={15} /></Link> : <ReminderButton scheduleId={item.id} />}</article>; })}</div></section>)}</div></main><AppFooter /></div>;
}
