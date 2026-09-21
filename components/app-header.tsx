import { useEffect,useState } from 'react';
import { Search } from 'lucide-react';
import Link,{usePathname} from '@/lib/navigation';
import { assetUrl } from '@/lib/paths';
import { WalletButton } from './wallet-button';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './ui/dialog';
import { apiFetch } from '@/lib/api';
import { CATEGORIES,relativeTime } from '@/lib/categories';
import type { Stream } from '@/lib/types';
import { CoinAvatar } from './coin-avatar';
export function AppHeader() {
  const pathname=usePathname();
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[results,setResults]=useState<Stream[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(o=>!o);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  useEffect(()=>{setOpen(false);},[pathname]);
  useEffect(()=>{
    if(!open)return;const c=new AbortController();setLoading(true);setError('');setResults([]);
    const timer=setTimeout(()=>{void apiFetch<{streams:Stream[]}>(`/api/channels?q=${encodeURIComponent(query.trim())}&limit=12`,{signal:c.signal}).then(data=>{if(!c.signal.aborted)setResults(data.streams);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});},200);
    return()=>{c.abort();clearTimeout(timer);};
  },[query,open]);
  const matchedCategories=CATEGORIES.filter(c=>`${c.name} ${c.label}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Sub Stream home"><img src={assetUrl('sub-stream-logo.png')} alt="" width={44} height={44}/><span>sub<span className="brand-blue">stream</span></span></Link>
      <button className="header-search" onClick={()=>setOpen(true)} aria-label="Search coins, channels and categories"><Search size={18}/><span>Search coins, channels, categories</span><kbd>Ctrl K</kbd></button>
      <div className="header-actions"><Link className="go-live-button" href="/go-live"><span className="broadcast-dot"/>Go Live</Link><WalletButton/></div>
    </header>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="search-dialog">
      <DialogTitle className="sr-only">Search Sub Stream</DialogTitle><DialogDescription className="sr-only">Find coins, live and offline channels, or browse a category.</DialogDescription>
      <div className="search-field"><Search size={21}/><input aria-label="Search Sub Stream" placeholder="Find your community…" maxLength={80} value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')}>Clear</button>}</div>
      <div className="search-results" aria-live="polite"><div className="search-section-heading"><span>{query?'Channels':'Live & recently active'}</span><small>Live and offline</small></div>
        {loading?<p className="search-message">Searching channels…</p>:error?<p className="search-message" role="alert">{error}</p>:results.length?results.map(s=><Link className="search-result" key={s.id} href={`/stream/${s.slug}`} onClick={()=>setOpen(false)}><CoinAvatar symbol={s.market.symbol} src={s.market.imageUrl}/><span className="search-result-copy"><b>{s.market.name}<small>{s.market.symbol}</small></b><span>{s.title}</span></span><span className={`search-result-state ${s.status==='live'?'is-live':''}`}>{s.status==='live'?<><i/>{s.viewerCount} watching</>:s.lastLiveAt?`Last live ${relativeTime(s.lastLiveAt)}`:'Offline'}</span></Link>):<p className="search-message">{query?'No channels match that search.':'Channels will appear here after creators set them up.'}</p>}
        {matchedCategories.length>0&&<><div className="search-section-heading"><span>Categories</span></div><div className="search-categories">{matchedCategories.map(c=><Link key={c.id} href={`/category/${c.id}`} onClick={()=>setOpen(false)}><span className={`category-swatch category-${c.id}`}/><span>{c.label}<small>{c.short}</small></span><span aria-hidden="true">↗</span></Link>)}</div></>}
      </div><div className="search-footer"><span>Find a coin even when it’s offline.</span><span><kbd>esc</kbd> to close</span></div>
    </DialogContent></Dialog>
    <nav className="mobile-nav" aria-label="Mobile navigation">{[['/','Browse'],['/categories','Categories'],['/following','Following'],['/studio','Studio']].map(([href,label])=><Link href={href} key={href} className={pathname===href?'nav-active':''}>{label}</Link>)}</nav>
  </>;
}
