import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
export interface CreatorMarket { id:string; name:string; symbol:string; mint:string; image_url?:string|null; stream_id?:string|null; slug?:string|null; stream_status?:string|null; }
export interface CreatorChannel { id:string; market_id:string; market_name:string; symbol:string; image_url?:string|null; slug:string; title:string; description:string; category:string; thumbnail_url?:string|null; status:string; viewer_count:number; live_started_at:number|null; last_error?:string|null; }
export interface Credentials { server:string; streamKey:string; }
export function useCreatorData(token:string|null) {
  const [markets,setMarkets]=useState<CreatorMarket[]>([]),[channels,setChannels]=useState<CreatorChannel[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const request=useRef<AbortController|null>(null);
  const reload=useCallback(async()=>{
    request.current?.abort(); const controller=new AbortController();request.current=controller;
    if(!token){setMarkets([]);setChannels([]);setLoading(false);return;}
    setLoading(true);
    try { const [m,s]=await Promise.all([apiFetch<{markets:CreatorMarket[]}>('/api/creator/markets',{signal:controller.signal},token),apiFetch<{streams:CreatorChannel[]}>('/api/creator/streams',{signal:controller.signal},token)]);
      if(!controller.signal.aborted){setMarkets(m.markets);setChannels(s.streams);setError('');}
    } catch(e){if(!controller.signal.aborted)setError((e as Error).message);}finally{if(!controller.signal.aborted)setLoading(false);}
  },[token]);
  useEffect(()=>{setMarkets([]);setChannels([]);void reload();return()=>request.current?.abort();},[reload]);
  return {markets,channels,loading,error,reload};
}
