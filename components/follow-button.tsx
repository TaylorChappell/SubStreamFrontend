"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Bell, BellCheck } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/app/providers";
import { apiFetch, API_CONFIGURED } from "@/lib/api";

export function FollowButton({ marketId, initial = false }: { marketId: string; initial?: boolean }) {
  const { wallet, token } = useWallet();
  const [remoteFollowed, setRemoteFollowed] = useState(initial);
  const subscribe = useCallback((onChange: () => void) => {
    const sync = () => onChange();
    window.addEventListener("substream:follow", sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener("substream:follow", sync); window.removeEventListener("storage", sync); };
  }, []);
  const previewFollowed = useSyncExternalStore(subscribe, () => localStorage.getItem(`substream.follow.${marketId}`) === "1", () => initial);
  const followed = API_CONFIGURED ? remoteFollowed : previewFollowed;
  const toggle = async () => {
    if (!wallet) return toast.error("Connect your wallet to follow this coin.");
    try {
      const next = API_CONFIGURED ? (await apiFetch<{ followed: boolean }>(`/api/markets/${encodeURIComponent(marketId)}/follow`, { method: "POST" }, token)).followed : !followed;
      if (API_CONFIGURED) setRemoteFollowed(next);
      else { if (next) localStorage.setItem(`substream.follow.${marketId}`, "1"); else localStorage.removeItem(`substream.follow.${marketId}`); window.dispatchEvent(new CustomEvent("substream:follow", { detail: { marketId, followed: next } })); }
      toast.success(next ? "Following this coin" : "Unfollowed this coin");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update follow"); }
  };
  return <button className={`follow-button ${followed ? "following" : ""}`} type="button" onClick={() => void toggle()}>{followed ? <BellCheck size={17} /> : <Bell size={17} />}{followed ? "Following" : "Follow"}</button>;
}
