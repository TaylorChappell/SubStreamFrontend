import Link from '@/lib/navigation';
import { assetUrl } from '@/lib/paths';

export function AppFooter() {
  return <footer>
    <Link href="/" className="footer-brand" aria-label="Sub Stream home"><img src={assetUrl('sub-stream-logo.png')} alt="" width={30} height={30}/><span>SUB STREAM</span></Link>
    <div>
      <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link>
      <a className="footer-social" href="https://x.com/SubStream_Aqua" target="_blank" rel="noopener noreferrer" aria-label="Sub Stream on X" title="Sub Stream on X">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.491h2.039L6.487 3.24H4.3l13.31 17.404Z"/></svg>
      </a>
      <a className="footer-social" href="https://x.com/Aqua_Launchpad" target="_blank" rel="noopener noreferrer" aria-label="AQUA Launchpad on X" title="AQUA Launchpad on X"><img src={assetUrl('aqua-mark.svg')} alt="" width={32} height={32}/></a>
    </div>
  </footer>;
}
