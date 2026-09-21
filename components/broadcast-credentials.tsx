import { useState } from 'react';
import { toast } from 'sonner';
import type { Credentials } from '@/lib/creator';
export function BroadcastCredentials({credentials}:{credentials:Credentials}) {
  const [visible,setVisible]=useState(false),[copied,setCopied]=useState('');
  async function copy(value:string,label:string){try{await navigator.clipboard.writeText(value);setCopied(label);toast.success(`${label} copied`);}catch{toast.error('Copy was blocked. Select the value and copy it manually.');}}
  return <div className="broadcast-credentials"><label>Server URL<div className="copy-field"><input aria-label="OBS server URL" readOnly value={credentials.server}/><button type="button" onClick={()=>void copy(credentials.server,'Server URL')}>{copied==='Server URL'?'Copied':'Copy'}</button></div></label><label>Stream key<div className="copy-field"><input aria-label="OBS stream key" type={visible?'text':'password'} readOnly autoComplete="off" value={credentials.streamKey}/><button type="button" onClick={()=>setVisible(v=>!v)}>{visible?'Hide':'Show'}</button><button type="button" onClick={()=>void copy(credentials.streamKey,'Stream key')}>{copied==='Stream key'?'Copied':'Copy'}</button></div></label><p className="field-hint">Keep your stream key private. Anyone with it can broadcast to this channel.</p></div>;
}
