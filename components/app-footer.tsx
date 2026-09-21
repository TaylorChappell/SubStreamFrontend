import Link from '@/lib/navigation';
import { assetUrl } from '@/lib/paths';

export function AppFooter() {
  return <footer><Link href="/" className="footer-brand" aria-label="Sub Stream home"><img src={assetUrl('sub-stream-logo.png')} alt="" width={30} height={30}/><span>SUB STREAM</span></Link><p>Live communities from the AQUA ecosystem.</p><div><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><a href="https://x.com/Aqua_Launchpad" target="_blank" rel="noreferrer">X</a></div></footer>;
}
