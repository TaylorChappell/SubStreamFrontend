"use client";
import { createContext,useCallback,useContext,useEffect,useMemo,useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import type { StandardConnectFeature,StandardDisconnectFeature,StandardEventsFeature } from '@wallet-standard/features';
import type { SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { apiFetch,apiBase } from '@/lib/api';
import { WebMcpTools } from '@/components/webmcp-tools';
type StandardWallet = ReturnType<ReturnType<typeof getWallets>['get']>[number];
interface WalletOption {id:string;name:string;provider?:StandardWallet;installUrl?:string;}
interface WalletContextValue {wallet:string|null;token:string|null;connected:boolean;connecting:boolean;options:WalletOption[];connect(id:string):Promise<boolean>;signOut():Promise<void>;}
const WalletContext=createContext<WalletContextValue|null>(null);
export function encodeBase58(bytes:Uint8Array) {
 const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
 let value=BigInt(0); for(const byte of bytes)value=value*BigInt(256)+BigInt(byte);
 let output='';while(value>BigInt(0)){output=alphabet[Number(value%BigInt(58))]+output;value/=BigInt(58);}
 for(const byte of bytes){if(byte!==0)break;output='1'+output;}return output;
}
function WalletProvider({children}:{children:React.ReactNode}) {
 const [wallet,setWallet]=useState<string|null>(null);const [token,setToken]=useState<string|null>(null);const [connecting,setConnecting]=useState(false);const [options,setOptions]=useState<WalletOption[]>([]);const [active,setActive]=useState<StandardWallet|null>(null);
 const clear=useCallback(()=>{setWallet(null);setToken(null);setActive(null);sessionStorage.removeItem('substream.session');localStorage.removeItem('substream.wallet');localStorage.removeItem('substream.token');},[]);
 useEffect(()=>{
  const registry=getWallets();const update=()=>{const detected=registry.get().filter(w=>w.chains.some(c=>c.startsWith('solana:'))&&w.features['standard:connect']&&w.features['solana:signMessage']);const next:WalletOption[]=detected.map(w=>({id:w.name,name:w.name,provider:w}));for(const [name,url]of [['Phantom','https://phantom.app/download'],['MetaMask','https://metamask.io/download/']])if(!next.some(o=>o.name.toLowerCase()===name.toLowerCase()))next.push({id:name,name,installUrl:url});setOptions(next);};update();const off1=registry.on('register',update),off2=registry.on('unregister',update);
  const expired=()=>{clear();toast.error('Your session expired. Connect your wallet again.');};window.addEventListener('substream:session-expired',expired);
  let cancelled=false;
  try{const saved=JSON.parse(sessionStorage.getItem('substream.session')||'null') as {token:string;provider:string}|null;if(saved)void apiFetch<{user:{wallet:string}}>('/api/auth/me',{},saved.token).then(result=>{if(!cancelled){setToken(saved.token);setWallet(result.user.wallet);setActive(registry.get().find(w=>w.name===saved.provider)||null);}}).catch(()=>{if(!cancelled)clear();});}catch{clear();}
  return()=>{cancelled=true;off1();off2();window.removeEventListener('substream:session-expired',expired);};
 },[clear]);
 useEffect(()=>{if(!active||!wallet)return;const events=active.features['standard:events'] as StandardEventsFeature['standard:events']|undefined;return events?.on('change',changes=>{if(changes.accounts&&!changes.accounts.some(a=>a.address===wallet)){clear();toast.info('Wallet account changed. Sign in again to continue.');}});},[active,wallet,clear]);
 const connect=useCallback(async(id:string)=>{
  if(connecting)return false;const option=options.find(o=>o.id===id);if(!option?.provider){if(option?.installUrl)window.open(option.installUrl,'_blank','noopener,noreferrer');return false;}
  setConnecting(true);
  try{await apiBase();const provider=option.provider;const result=await(provider.features['standard:connect']as StandardConnectFeature['standard:connect']).connect();const account=result.accounts.find(a=>a.chains.some(c=>c.startsWith('solana:'))&&a.features.includes('solana:signMessage'));if(!account)throw new Error('Select a Solana account that supports message signing.');
   const challenge=await apiFetch<{id:string;message:string}>('/api/auth/challenge',{method:'POST',body:JSON.stringify({wallet:account.address})});
   const message=new TextEncoder().encode(challenge.message);const [signed]=await(provider.features['solana:signMessage']as SolanaSignMessageFeature['solana:signMessage']).signMessage({account,message});if(!signed||signed.signedMessage.length!==message.length||!signed.signedMessage.every((byte,index)=>byte===message[index]))throw new Error('The wallet changed the sign-in message. Please use a compatible Solana wallet.');
   const verified=await apiFetch<{accessToken:string}>('/api/auth/verify',{method:'POST',body:JSON.stringify({wallet:account.address,challengeId:challenge.id,signature:encodeBase58(signed.signature)})});setWallet(account.address);setToken(verified.accessToken);setActive(provider);sessionStorage.setItem('substream.session',JSON.stringify({token:verified.accessToken,provider:provider.name}));toast.success('Wallet connected');return true;
  }catch(e){toast.error((e as Error).message);return false;}finally{setConnecting(false);}
 },[options,connecting]);
 const signOut=useCallback(async()=>{const provider=active;clear();await(provider?.features['standard:disconnect']as StandardDisconnectFeature['standard:disconnect']|undefined)?.disconnect().catch(()=>undefined);},[active,clear]);
 const value=useMemo(()=>({wallet,token,connected:Boolean(wallet&&token),connecting,options,connect,signOut}),[wallet,token,connecting,options,connect,signOut]);
 return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
export function useWallet(){const value=useContext(WalletContext);if(!value)throw new Error('Wallet provider is missing');return value;}
export function Providers({children}:{children:React.ReactNode}){return <><WalletProvider>{children}<WebMcpTools/><Toaster position="bottom-right" richColors/></WalletProvider></>;}
