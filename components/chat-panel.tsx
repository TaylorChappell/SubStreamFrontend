"use client";
import { FormEvent, useEffect, useRef, useState } from 'react';
import { LockKeyhole, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/app/providers';
import { apiFetch, wsUrl } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';
import { ReportDialog } from './report-dialog';
const short=(wallet:string)=>wallet.slice(0,4)+'…'+wallet.slice(-4);
export function ChatPanel({streamId,initialMessages}:{streamId:string;initialMessages:ChatMessage[]}) {
 const {wallet,token}=useWallet();const [messages,setMessages]=useState(initialMessages);const [body,setBody]=useState('');const [ready,setReady]=useState(false);const [status,setStatus]=useState('Connect your wallet to join holder chat.');const [readError,setReadError]=useState('');const [role,setRole]=useState('');const [retry,setRetry]=useState(0);const socket=useRef<WebSocket|null>(null);const scroller=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{let active=true;const load=async()=>{try{const result=await apiFetch<{messages:ChatMessage[]}>(`/api/streams/${streamId}/chat`);if(active){setMessages(result.messages);setReadError('');}}catch(e){if(active)setReadError((e as Error).message);}};void load();const timer=setInterval(()=>void load(),8000);return()=>{active=false;clearInterval(timer);};},[streamId,retry]);
 useEffect(()=>{
  let cancelled=false;let timer:ReturnType<typeof setTimeout>|undefined;let attempts=0;
  setReady(false);setRole('');
  async function connect(){
   if(!token){setStatus('Connect your wallet to join holder chat.');return;}
   setStatus('Checking your holdings…');
   try {
    const {ticket}=await apiFetch<{ticket:string}>(`/api/streams/${streamId}/chat-ticket`,{method:'POST'},token);
    const url=await wsUrl(`/ws/chat/${streamId}?ticket=${encodeURIComponent(ticket)}`);if(cancelled)return;
    const ws=new WebSocket(url);socket.current=ws;
    ws.onmessage=event=>{if(cancelled)return;try{const payload=JSON.parse(event.data);if(payload.type==='ready'){setReady(true);setRole(payload.role);setStatus('');attempts=0;}
     if(payload.type==='message'&&payload.message)setMessages(current=>current.some(m=>m.id===payload.message.id)?current:[...current,payload.message].slice(-100));
     if(payload.type==='message_deleted')setMessages(current=>current.filter(m=>m.id!==payload.id));
     if(payload.type==='error')toast.error(payload.error);
     if(payload.type==='moderation'&&payload.wallet===wallet&&payload.action==='ban'){setReady(false);setStatus('You have been removed from this chat.');ws.close(4003);}
    }catch{setStatus('Chat received an invalid message.');}};
    ws.onerror=()=>{if(!cancelled)setStatus('Chat connection interrupted. Reconnecting…');};
    ws.onclose=event=>{if(cancelled)return;setReady(false);if(event.code===4003){setStatus('Chat access has ended. Recheck your holdings to continue.');return;}setStatus('Reconnecting to chat…');timer=setTimeout(()=>void connect(),Math.min(30000,1500*2**attempts++));};
   }catch(e){if(!cancelled){setReady(false);setStatus((e as Error).message);}}
  } void connect();
  return()=>{cancelled=true;clearTimeout(timer);socket.current?.close(1000);socket.current=null;};
 },[streamId,token,wallet,retry]);
 useEffect(()=>{scroller.current?.scrollTo({top:scroller.current.scrollHeight,behavior:'smooth'});},[messages.length]);
 function submit(event:FormEvent){event.preventDefault();if(!ready||!body.trim())return;if(socket.current?.readyState!==WebSocket.OPEN)return toast.error('Chat is reconnecting.');socket.current.send(JSON.stringify({type:'message',body:body.trim()}));setBody('');}
 async function remove(id:number){try{await apiFetch(`/api/moderation/streams/${streamId}/messages/${id}`,{method:'DELETE'},token);setMessages(current=>current.filter(m=>m.id!==id));}catch(e){toast.error((e as Error).message);}}
 const manager=['creator','moderator','admin'].includes(role);
 return <aside className="chat-panel" aria-label="Holder chat"><div className="chat-heading"><div><h2>Holder chat</h2><p>Everyone can read. Holders can post.</p></div><ShieldCheck size={20}/></div><div className="chat-messages" ref={scroller}>{readError&&<p role="status">{readError}</p>}{!messages.length&&!readError&&<p className="empty-copy">No messages yet.</p>}{messages.map(message=><article className="chat-message" key={message.id}><div className={`chat-avatar ${message.role}`}>{(message.username||message.wallet).slice(0,1).toUpperCase()}</div><div><div className="chat-author"><b title={message.wallet}>{message.username||short(message.wallet)}</b>{message.role!=='holder'&&<span>{message.role==='moderator'?'Mod':message.role}</span>}<time>{new Date(message.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></div><p>{message.body}</p>{token&&<div className="inline-actions">{manager&&<button onClick={()=>void remove(message.id)} aria-label="Delete message"><Trash2 size={13}/></button>}<ReportDialog streamId={streamId} reportedWallet={message.wallet}/></div>}</div></article>)}</div><div>{!ready&&<div className="chat-access"><LockKeyhole size={16}/><span>{status}</span></div>}{token&&!ready&&<button className="chat-retry" onClick={()=>setRetry(v=>v+1)}>Recheck chat access</button>}</div><form className="chat-compose" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Chat message</label><input id="chat-message" value={body} onChange={event=>setBody(event.target.value)} placeholder={ready?'Message holders…':'Holder chat'} disabled={!ready} maxLength={300}/><button disabled={!ready||!body.trim()} aria-label="Send message"><Send size={18}/></button></form></aside>;
}
