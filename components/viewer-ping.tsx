"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useWallet } from "@/app/providers";

export function ViewerPing({ streamId }: { streamId: string }) {
  const { token } = useWallet();
  useEffect(() => {
    let sessionId = ""; let stopped = false; let timer: ReturnType<typeof setInterval> | null = null;
    void apiFetch<{ viewerSessionId: string }>(`/api/streams/${streamId}/viewers`, { method: "POST" }, token).then((result) => {
      if (stopped) return; sessionId = result.viewerSessionId;
      timer = setInterval(() => void apiFetch(`/api/viewers/${sessionId}/heartbeat`, { method: "POST" }, token).catch(() => undefined), 20_000);
    }).catch(() => undefined);
    return () => { stopped = true; if (timer) clearInterval(timer); };
  }, [streamId, token]);
  return null;
}
