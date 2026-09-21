"use client";

import { assetUrl } from "@/lib/paths";
import Link from '@/lib/navigation';
import { usePathname, useRouter } from '@/lib/navigation';
import { useEffect, useState } from "react";
import { Compass, Heart, Radio, Search, Video } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { WalletButton } from "./wallet-button";
import { apiFetch } from "@/lib/api";
import type { Stream } from "@/lib/types";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query,setQuery]=useState(''); const [results,setResults]=useState<Stream[]>([]); const [searchStatus,setSearchStatus]=useState('Type a coin or stream name.');
  useEffect(()=>{if(!searchOpen)return;const controller=new AbortController();setSearchStatus('Searching…');const timer=setTimeout(()=>{void apiFetch<{streams:Stream[]}>(`/api/explore?q=${encodeURIComponent(query)}&limit=20`,{signal:controller.signal}).then(data=>{setResults(data.streams);setSearchStatus(data.streams.length?'':'No live streams found.');}).catch(e=>{if(!controller.signal.aborted){setResults([]);setSearchStatus(e.message);}});},250);return()=>{controller.abort();clearTimeout(timer);};},[query,searchOpen]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen((value) => !value); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  const navigate = (path: string) => { setSearchOpen(false); router.push(path); };
  return <>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Sub Stream home"><img src={assetUrl("sub-stream-mark.png")} alt="" width={48} height={48} /><span>SUB <b>STREAM</b></span></Link>
      <nav aria-label="Primary navigation">
        <Link className={pathname === "/" ? "nav-active" : ""} href="/">Explore</Link>
        <Link className={pathname.startsWith("/following") ? "nav-active" : ""} href="/following">Following</Link>
        <Link className={pathname.startsWith("/studio") ? "nav-active" : ""} href="/studio">Creator studio</Link>
      </nav>
      <div className="header-actions"><button className="search-button" type="button" onClick={() => setSearchOpen(true)} aria-label="Search streams"><Search size={18} /><span>Search</span><kbd>⌘ K</kbd></button><WalletButton /></div>
    </header>
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search Sub Stream" description="Find a live AQUA community">
      <CommandInput placeholder="Search coins or streams…" value={query} onValueChange={setQuery} />
      <CommandList><CommandEmpty>{searchStatus}</CommandEmpty><CommandGroup heading="Live now">
        {results.map((stream) => <CommandItem key={stream.id} value={`${stream.market.symbol} ${stream.market.name} ${stream.title}`} onSelect={() => navigate(`/stream/${stream.slug}`)}><Radio className="text-[#ff7168]" /><span><b>{stream.market.symbol}</b> · {stream.title}</span><small className="ml-auto text-muted-foreground">{stream.viewerCount}</small></CommandItem>)}
      </CommandGroup></CommandList>
    </CommandDialog>
    <nav className="mobile-nav" aria-label="Mobile navigation"><Link className={pathname === "/" ? "nav-active" : ""} href="/"><Compass size={19} /><span>Explore</span></Link><Link className={pathname.startsWith("/following") ? "nav-active" : ""} href="/following"><Heart size={19} /><span>Following</span></Link><Link className={pathname.startsWith("/studio") ? "nav-active" : ""} href="/studio"><Video size={19} /><span>Studio</span></Link></nav>
  </>;
}
