import { useEffect,useState } from 'react';
import Link from '@/lib/navigation';
import { CATEGORIES } from '@/lib/categories';
import { apiFetch } from '@/lib/api';
export function CategoryCards() {
  const [stats,setStats]=useState<Array<{name:string;live:number;channels:number}>>([]);
  useEffect(()=>{const c=new AbortController();void apiFetch<{categories:typeof stats}>('/api/categories',{signal:c.signal}).then(data=>setStats(data.categories)).catch(()=>{});return()=>c.abort();},[]);
  return <div className="category-grid">{CATEGORIES.map(item=>{const stat=stats.find(s=>s.name===item.name);return <Link className={`category-card category-${item.id}`} href={`/category/${item.id}`} key={item.id}><div className="category-poster" aria-hidden="true"><span className="poster-number">{item.code} / SUB STREAM</span><strong>{item.word}</strong><div className="poster-art"><i/><i/><i/><i/></div><span className="poster-caption">{item.short}</span></div><h3>{item.label}</h3><p>{stat?stat.live?`${stat.live} live ${stat.live===1?'channel':'channels'}`:`${stat.channels} ${stat.channels===1?'channel':'channels'}`:item.short}</p></Link>;})}</div>;
}
