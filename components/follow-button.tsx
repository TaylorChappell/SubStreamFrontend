"use client";
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/app/providers';
import { apiFetch } from '@/lib/api';
export function FollowButton({ marketId, initial = false }: { marketId: string; initial?: boolean }) {
  const { token } = useWallet(); const [followed, setFollowed] = useState(initial); const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; setReady(false); setFollowed(false); if(token) void apiFetch<{ followed: boolean }>(`/api/markets/${encodeURIComponent(marketId)}/follow`, {}, token).then(result => { if(active) { setFollowed(result.followed); setReady(true); } }).catch(() => { if(active) setReady(true); }); return () => { active=false; }; }, [token, marketId]);
  async function toggle() { if(!token) return toast.error('Connect your wallet to follow this coin.'); setBusy(true); try { const result=await apiFetch<{followed:boolean}>(`/api/markets/${encodeURIComponent(marketId)}/follow`, { method:'PUT', body:JSON.stringify({ followed:!followed }) }, token); setFollowed(result.followed); window.dispatchEvent(new Event('substream:follow')); } catch(e) { toast.error((e as Error).message); } finally { setBusy(false); } }
  return <button className={`follow-button ${followed?'following':''}`} disabled={busy || Boolean(token && !ready)} aria-pressed={followed} onClick={() => void toggle()}><Heart size={17} fill={followed?'currentColor':'none'}/>{followed?'Following':'Follow'}</button>;
}
