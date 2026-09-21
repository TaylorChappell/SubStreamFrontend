"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Schedule } from '@/lib/types';
import { ReminderButton } from './reminder-button';
export function ScheduleList({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Schedule[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; async function load() { try { const result = await apiFetch<{ schedules: Schedule[] }>('/api/schedules'); if (active) { setItems(result.schedules); setError(''); } } catch(e) { if(active) setError((e as Error).message); } finally { if(active) setLoading(false); } } void load(); const timer = setInterval(() => void load(), 60000); return () => { active=false; clearInterval(timer); }; }, [retry]);
  if(error) return <div className="schedule-empty"><p>{error}</p><button className="soft-button" onClick={() => setRetry(value => value + 1)}>Reload schedule</button></div>;
  if(loading || !items.length) return <p className="schedule-empty">{loading ? 'Loading schedule…' : 'No broadcasts scheduled yet.'}</p>;
  return <div className="schedule-list">{(compact ? items.slice(0,3) : items).map(item => <article key={item.id}><time dateTime={new Date(item.scheduledFor).toISOString()}><b>{new Date(item.scheduledFor).getDate()}</b><span>{new Date(item.scheduledFor).toLocaleDateString([], { month:'short' })}</span></time><span className="schedule-symbol">{item.symbol.slice(0,1)}</span><div><h3>{item.slug ? <Link href={`/stream/${item.slug}`}>{item.title}</Link> : item.title}</h3><p>{item.marketName} · {new Date(item.scheduledFor).toLocaleString([], { weekday:'short', hour:'numeric', minute:'2-digit' })} · {item.durationMinutes} min</p></div><ReminderButton schedule={item}/></article>)}</div>;
}
