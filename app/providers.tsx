"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "next-themes";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { apiFetch, API_CONFIGURED } from "@/lib/api";
import { WebMcpTools } from "@/components/webmcp-tools";

interface SolanaProvider {
  publicKey?: { toString(): string };
  isPhantom?: boolean;
  isMetaMask?: boolean;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey?: { toString(): string } } | void>;
  disconnect?(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array | string } | Uint8Array | string>;
}

interface WalletOption { id: "phantom" | "metamask"; name: string; provider?: SolanaProvider; installUrl: string; }
interface WalletContextValue {
  wallet: string | null;
  token: string | null;
  connected: boolean;
  connecting: boolean;
  options: WalletOption[];
  connect(id: WalletOption["id"]): Promise<void>;
  signOut(): Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);
const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array) {
  if (!bytes.length) return "";
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      const value = digits[index]! * 256 + carry;
      digits[index] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry) { digits.push(carry % 58); carry = Math.floor(carry / 58); }
  }
  let output = "";
  for (const byte of bytes) { if (byte === 0) output += alphabet[0]; else break; }
  for (let index = digits.length - 1; index >= 0; index -= 1) output += alphabet[digits[index]!]!;
  return output;
}

function findProviders(): WalletOption[] {
  if (typeof window === "undefined") return [];
  const browser = window as unknown as {
    phantom?: { solana?: SolanaProvider };
    solana?: SolanaProvider & { providers?: SolanaProvider[] };
    metamask?: { solana?: SolanaProvider };
  };
  const providers = [browser.phantom?.solana, ...(browser.solana?.providers ?? []), browser.solana, browser.metamask?.solana].filter(Boolean) as SolanaProvider[];
  const phantom = providers.find((provider) => provider.isPhantom) ?? browser.phantom?.solana;
  const metamask = providers.find((provider) => provider.isMetaMask) ?? browser.metamask?.solana;
  return [
    { id: "phantom", name: "Phantom", provider: phantom, installUrl: "https://phantom.app/download" },
    { id: "metamask", name: "MetaMask", provider: metamask, installUrl: "https://metamask.io/download/" },
  ];
}

function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [options, setOptions] = useState<WalletOption[]>([]);
  const [activeProvider, setActiveProvider] = useState<SolanaProvider | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const detected = findProviders();
      setOptions(detected);
      const savedWallet = localStorage.getItem("substream.wallet");
      const savedToken = localStorage.getItem("substream.token");
      if (savedWallet) setWallet(savedWallet);
      if (savedToken) setToken(savedToken);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const connect = useCallback(async (id: WalletOption["id"]) => {
    const option = findProviders().find((candidate) => candidate.id === id);
    if (!option?.provider) { window.open(option?.installUrl ?? "https://phantom.app/download", "_blank", "noopener,noreferrer"); return; }
    setConnecting(true);
    try {
      const result = await option.provider.connect();
      const address = result?.publicKey?.toString() ?? option.provider.publicKey?.toString();
      if (!address) throw new Error(`${option.name} did not return a Solana account.`);
      let accessToken: string | null = null;
      if (API_CONFIGURED) {
        const challenge = await apiFetch<{ id: string; message: string }>("/api/auth/challenge", { method: "POST", body: JSON.stringify({ wallet: address }) });
        const signed = await option.provider.signMessage(new TextEncoder().encode(challenge.message), "utf8");
        const rawSignature = typeof signed === "object" && "signature" in signed ? signed.signature : signed;
        const signature = typeof rawSignature === "string" ? rawSignature : encodeBase58(rawSignature as Uint8Array);
        const verified = await apiFetch<{ accessToken: string }>("/api/auth/verify", { method: "POST", body: JSON.stringify({ wallet: address, challengeId: challenge.id, signature }) });
        accessToken = verified.accessToken;
      }
      setWallet(address); setToken(accessToken); setActiveProvider(option.provider);
      localStorage.setItem("substream.wallet", address);
      if (accessToken) localStorage.setItem("substream.token", accessToken); else localStorage.removeItem("substream.token");
      toast.success(API_CONFIGURED ? "Wallet connected" : "Wallet connected in preview mode");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed");
      throw error;
    } finally { setConnecting(false); }
  }, []);

  const signOut = useCallback(async () => {
    await activeProvider?.disconnect?.().catch(() => undefined);
    setWallet(null); setToken(null); setActiveProvider(null);
    localStorage.removeItem("substream.wallet"); localStorage.removeItem("substream.token");
    toast.success("Signed out");
  }, [activeProvider]);

  const value = useMemo(() => ({ wallet, token, connected: Boolean(wallet), connecting, options, connect, signOut }), [wallet, token, connecting, options, connect, signOut]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside Providers");
  return value;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" forcedTheme="dark"><WalletProvider>{children}<WebMcpTools /><Toaster position="bottom-right" richColors /></WalletProvider></ThemeProvider>;
}
