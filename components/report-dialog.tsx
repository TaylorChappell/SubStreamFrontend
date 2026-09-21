"use client";
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogTrigger } from './ui/dialog';
import { apiFetch } from '@/lib/api';
import { useWallet } from '@/app/providers';
export function ReportDialog({streamId,reportedWallet}:{streamId:string;reportedWallet?:string}) {
 const {token}=useWallet();const [open,setOpen]=useState(false);const [reason,setReason]=useState('spam');const [details,setDetails]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();if(!token)return toast.error('Connect your wallet to submit a report.');setBusy(true);try{await apiFetch('/api/reports',{method:'POST',body:JSON.stringify({streamId,reportedWallet,reason,details})},token);toast.success('Report submitted for review.');setOpen(false);setDetails('');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger className="chat-retry">{reportedWallet?'Report':'Report stream'}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Report {reportedWallet?'a chat participant':'this stream'}</DialogTitle><DialogDescription>Send the details to the moderation team.</DialogDescription></DialogHeader><form className="studio-card" onSubmit={submit}><label>Reason<select value={reason} onChange={e=>setReason(e.target.value)}>{['spam','harassment','copyright','illegal_content','other'].map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select></label><label>Details<textarea value={details} onChange={e=>setDetails(e.target.value)} maxLength={1000}/></label><button className="primary-action" disabled={busy}>Submit report</button></form></DialogContent></Dialog>;
}
