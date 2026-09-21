import { useState } from 'react';
export function CoinAvatar({symbol,src,size='normal'}:{symbol:string;src?:string|null;size?:'small'|'normal'|'large'}) {
  const [failed,setFailed]=useState(false);
  return <span className={`coin-avatar ${size}`}>{src&&!failed?<img src={src} alt="" loading="lazy" onError={()=>setFailed(true)}/>:symbol.slice(0,2).toUpperCase()}</span>;
}
