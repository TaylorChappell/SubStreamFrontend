"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LockKeyhole, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/app/providers";
import { API_CONFIGURED, apiFetch, wsUrl } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

function short(wallet: string) { return wallet.length > 12 ? `${wallet.slice(0,4)}…${wallet.slice(-4)}` : wallet; }
function roleLabel(role: ChatMessage["role"]) { return role === "creator" ? "Creator" : role === "moderator" ? "Mod" : role === "admin" ? "Admin" : null; }

export function ChatPanel({ streamId, initialMessages }: { streamId: string; initialMessages: ChatMessage[] }) {
  const { wallet, token } = useWallet();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [access, setAccess] = useState<"read-only" | "checking" | "ready" | "blocked">("read-only");
  const [accessMessage, setAccessMessage] = useState("Connect your wallet to join holder chat.");
  const socket = useRef<WebSocket | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!wallet) { setAccess("read-only"); setAccessMessage("Connect your wallet to join holder chat."); return; }
      if (!API_CONFIGURED) { setAccess("ready"); setAccessMessage(""); return; }
      if (!token) { setAccess("blocked"); setAccessMessage("Sign the wallet message again to use chat."); return; }
      setAccess("checking"); setAccessMessage("Checking your holdings…");
      void apiFetch<{ ticket: string }>(`/api/streams/${streamId}/chat-ticket`, { method: "POST" }, token).then(({ ticket }) => {
        if (cancelled) return;
        const ws = new WebSocket(wsUrl(`/ws/chat/${streamId}?ticket=${encodeURIComponent(ticket)}`)); socket.current = ws;
        ws.onopen = () => { setAccess("ready"); setAccessMessage(""); };
        ws.onmessage = (event) => {
          const payload = JSON.parse(event.data) as { type: string; message?: ChatMessage; id?: number; error?: string };
          if (payload.type === "message" && payload.message) setMessages((current) => current.some((message) => message.id === payload.message!.id) ? current : [...current, payload.message!]);
          if (payload.type === "message_deleted" && payload.id) setMessages((current) => current.filter((message) => message.id !== payload.id));
          if (payload.type === "error" && payload.error) { setAccess("blocked"); setAccessMessage(payload.error); }
        };
        ws.onerror = () => { setAccess("blocked"); setAccessMessage("Chat could not connect. Try again in a moment."); };
        ws.onclose = (event) => { if (!cancelled && event.code !== 1000) { setAccess("blocked"); setAccessMessage(event.reason || "Chat access ended."); } };
      }).catch((error) => { if (!cancelled) { setAccess("blocked"); setAccessMessage(error instanceof Error ? error.message : "Chat access unavailable"); } });
    });
    return () => { cancelled = true; socket.current?.close(1000, "Page changed"); socket.current = null; };
  }, [streamId, token, wallet]);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);
  const canSend = access === "ready" && Boolean(wallet);
  const placeholder = useMemo(() => canSend ? "Message holders…" : accessMessage, [canSend, accessMessage]);
  const submit = (event: FormEvent) => {
    event.preventDefault(); const text = body.trim(); if (!text || !wallet || !canSend) return;
    if (!API_CONFIGURED) setMessages((current) => [...current, { id: Date.now(), wallet, username: null, body: text, role: "holder", createdAt: Date.now() }]);
    else if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: "message", body: text }));
    else return toast.error("Chat is reconnecting.");
    setBody("");
  };
  return <aside className="chat-panel" aria-label="Holder chat">
    <div className="chat-heading"><div><h2>Holder chat</h2><p>Coin holders only</p></div><ShieldCheck size={20} /></div>
    <div className="chat-messages" ref={scroller}>{messages.map((message) => { const badge=roleLabel(message.role); return <article className="chat-message" key={message.id}><div className={`chat-avatar ${message.role}`}>{(message.username ?? message.wallet).slice(0,1).toUpperCase()}</div><div><div className="chat-author"><b>{message.username || short(message.wallet)}</b>{badge && <span className={message.role}>{badge}</span>}<time suppressHydrationWarning>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p>{message.body}</p></div></article>; })}</div>
    {access !== "ready" && <div className="chat-access"><LockKeyhole size={16} /><span>{accessMessage}</span></div>}
    <form className="chat-compose" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Chat message</label><input id="chat-message" value={body} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} disabled={!canSend} maxLength={300} /><button type="submit" disabled={!canSend || !body.trim()} aria-label="Send message"><Send size={18} /></button></form>
  </aside>;
}
