"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import type { StandardConnectFeature, StandardDisconnectFeature, StandardEventsFeature } from '@wallet-standard/features';
import type { SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { apiFetch, apiBase } from '@/lib/api';
import { SESSION_KEY, clearWalletSession, readWalletSession, restoreWalletSession, saveWalletSession, sessionFromToken, type WalletSession } from '@/lib/wallet-session';
import { WebMcpTools } from '@/components/webmcp-tools';

type StandardWallet = ReturnType<ReturnType<typeof getWallets>['get']>[number];
interface WalletOption { id: string; name: string; provider?: StandardWallet; installUrl?: string }
interface WalletContextValue { wallet: string | null; token: string | null; connected: boolean; connecting: boolean; options: WalletOption[]; connect(id: string): Promise<boolean>; signOut(): Promise<void> }
const WalletContext = createContext<WalletContextValue | null>(null);
export function encodeBase58(bytes: Uint8Array) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let value = BigInt(0); for (const byte of bytes) value = value * BigInt(256) + BigInt(byte);
  let output = ''; while (value > BigInt(0)) { output = alphabet[Number(value % BigInt(58))] + output; value /= BigInt(58); }
  for (const byte of bytes) { if (byte !== 0) break; output = '1' + output; } return output;
}

function WalletProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<WalletSession | null>(() => readWalletSession());
  const sessionRef = useRef(session), generation = useRef(0), busy = useRef(false);
  const [connecting, setConnecting] = useState(false), [options, setOptions] = useState<WalletOption[]>([]);
  const wallet = session?.wallet ?? null, token = session?.token ?? null;
  // Re-evaluate when wallets register after the page has already restored its session.
  const active = options.find(option => option.name === session?.provider)?.provider;
  const updateSession = useCallback((next: WalletSession | null, persist = true) => {
    generation.current += 1;
    sessionRef.current = next;
    setSession(next);
    if (persist) { if (next) saveWalletSession(next); else clearWalletSession(); }
  }, []);
  const clear = useCallback(() => updateSession(null), [updateSession]);

  useEffect(() => {
    const registry = getWallets();
    const update = () => {
      const detected = registry.get().filter(w => w.chains.some(c => c.startsWith('solana:')) && w.features['standard:connect'] && w.features['solana:signMessage']);
      const next: WalletOption[] = detected.map(w => ({ id: w.name, name: w.name, provider: w }));
      for (const [name, url] of [['Phantom', 'https://phantom.app/download'], ['MetaMask', 'https://metamask.io/download/']]) {
        if (!next.some(o => o.name.toLowerCase() === name.toLowerCase())) next.push({ id: name, name, installUrl: url });
      }
      setOptions(next);
    };
    update();
    const off1 = registry.on('register', update), off2 = registry.on('unregister', update);
    const expired = (event: Event) => {
      // A late 401 from an older request must not sign out a newer session.
      if ((event as CustomEvent<{ token: string }>).detail?.token !== sessionRef.current?.token) return;
      clear(); toast.error('Your session expired. Connect your wallet again.');
    };
    const changed = (event: StorageEvent) => {
      if (event.key !== SESSION_KEY && event.key !== null) return;
      const next = readWalletSession(false);
      if (next?.token !== sessionRef.current?.token) updateSession(next, false);
    };
    window.addEventListener('substream:session-expired', expired);
    window.addEventListener('storage', changed);
    return () => { off1(); off2(); window.removeEventListener('substream:session-expired', expired); window.removeEventListener('storage', changed); };
  }, [clear, updateSession]);

  useEffect(() => {
    const saved = sessionRef.current;
    if (!saved) return;
    let cancelled = false;
    const validate = () => void restoreWalletSession(saved, accessToken => apiFetch<{ user: { wallet: string } }>('/api/auth/me', {}, accessToken)).then(restored => {
      if (!cancelled && sessionRef.current?.token === saved.token && !restored) clear();
    });
    validate();
    window.addEventListener('online', validate);
    const expiry = window.setTimeout(() => { if (sessionRef.current?.token === saved.token) clear(); }, Math.max(0, saved.expiresAt - Date.now()));
    return () => { cancelled = true; window.clearTimeout(expiry); window.removeEventListener('online', validate); };
  }, [token, clear]);

  useEffect(() => {
    if (!active || !wallet) return;
    let cancelled = false, hasAccount = active.accounts.some(account => account.address === wallet);
    const changed = (accounts: StandardWallet['accounts']) => {
      if (cancelled) return;
      if (accounts.some(account => account.address === wallet)) { hasAccount = true; return; }
      // An empty list during extension initialization is not a sign-out.
      if (!accounts.length && !hasAccount) return;
      clear(); toast.info('Wallet account changed. Sign in again to continue.');
    };
    const events = active.features['standard:events'] as StandardEventsFeature['standard:events'] | undefined;
    const off = events?.on('change', changes => { if (changes.accounts) changed(changes.accounts); });
    void (active.features['standard:connect'] as StandardConnectFeature['standard:connect']).connect({ silent: true }).then(result => {
      // Locked wallets may return no accounts. The authenticated site session remains valid.
      if (result.accounts.length) changed(result.accounts);
    }).catch(() => undefined);
    return () => { cancelled = true; off?.(); };
  }, [active, wallet, clear]);

  const connect = useCallback(async (id: string) => {
    if (busy.current) return false;
    const option = options.find(o => o.id === id);
    if (!option?.provider) { if (option?.installUrl) window.open(option.installUrl, '_blank', 'noopener,noreferrer'); return false; }
    busy.current = true; setConnecting(true);
    const attempt = ++generation.current;
    try {
      await apiBase();
      const provider = option.provider;
      const result = await (provider.features['standard:connect'] as StandardConnectFeature['standard:connect']).connect();
      const account = result.accounts.find(a => a.chains.some(c => c.startsWith('solana:')) && a.features.includes('solana:signMessage'));
      if (!account) throw new Error('Select a Solana account that supports message signing.');
      const challenge = await apiFetch<{ id: string; message: string }>('/api/auth/challenge', { method: 'POST', body: JSON.stringify({ wallet: account.address }) });
      const message = new TextEncoder().encode(challenge.message);
      const [signed] = await (provider.features['solana:signMessage'] as SolanaSignMessageFeature['solana:signMessage']).signMessage({ account, message });
      if (!signed || signed.signedMessage.length !== message.length || !signed.signedMessage.every((byte, index) => byte === message[index])) throw new Error('The wallet changed the sign-in message. Please use a compatible Solana wallet.');
      const verified = await apiFetch<{ accessToken: string }>('/api/auth/verify', { method: 'POST', body: JSON.stringify({ wallet: account.address, challengeId: challenge.id, signature: encodeBase58(signed.signature) }) });
      if (attempt !== generation.current) return false;
      const next = sessionFromToken(verified.accessToken, provider.name);
      if (!next || next.wallet !== account.address) throw new Error('The sign-in response did not match your wallet. Please reconnect.');
      updateSession(next); toast.success('Wallet connected'); return true;
    } catch (error) { if (attempt === generation.current) toast.error((error as Error).message); return false; }
    finally { busy.current = false; setConnecting(false); }
  }, [options, updateSession]);
  const signOut = useCallback(async () => {
    const provider = active;
    clear();
    await (provider?.features['standard:disconnect'] as StandardDisconnectFeature['standard:disconnect'] | undefined)?.disconnect().catch(() => undefined);
  }, [active, clear]);
  const value = useMemo(() => ({ wallet, token, connected: Boolean(wallet && token), connecting, options, connect, signOut }), [wallet, token, connecting, options, connect, signOut]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
export function useWallet() { const value = useContext(WalletContext); if (!value) throw new Error('Wallet provider is missing'); return value; }
export function Providers({ children }: { children: React.ReactNode }) { return <><WalletProvider>{children}<WebMcpTools /><Toaster position="bottom-right" richColors /></WalletProvider></>; }
