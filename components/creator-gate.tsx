import { WalletButton } from './wallet-button';
import { assetUrl } from '@/lib/paths';
export function CreatorGate({live=false}:{live?:boolean}) {
  return <section className="creator-gate"><div className="gate-copy"><span className="kicker">{live?'YOUR NEXT BROADCAST':'CREATOR STUDIO'}</span><h1>Your coin.<br/>Your channel.</h1><p>Connect the wallet that created your AQUA coin to {live?'set up your broadcast':'manage your channels'}.</p><WalletButton/><span className="gate-note">One channel for each coin you create.</span></div><div className="gate-art" aria-hidden="true"><img src={assetUrl('sub-stream-logo.png')} alt=""/><span>Made for your community.</span></div></section>;
}
