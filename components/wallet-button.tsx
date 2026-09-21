"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, LogOut, WalletCards } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWallet } from "@/app/providers";

function short(value: string) { return `${value.slice(0,4)}…${value.slice(-4)}`; }

export function WalletButton() {
  const { wallet, connected, connecting, options, connect, signOut } = useWallet();
  const [open, setOpen] = useState(false);
  if (connected && wallet) return (
    <DropdownMenu>
      <DropdownMenuTrigger className="wallet-button wallet-connected"><span className="wallet-status" />{short(wallet)}<ChevronDown size={15} /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="wallet-menu">
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(wallet)}>Copy wallet address</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}><LogOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="wallet-button">{connecting ? "Connecting…" : "Connect wallet"}</DialogTrigger>
      <DialogContent className="wallet-dialog">
        <DialogHeader><DialogTitle>Connect a Solana wallet</DialogTitle><DialogDescription>Sign a message to use holder chat and creator tools. Connecting costs nothing.</DialogDescription></DialogHeader>
        <div className="wallet-options">
          {options.map((option) => (
            <button key={option.id} type="button" onClick={() => void connect(option.id).then(() => setOpen(false))}>
              <span className={`wallet-logo ${option.id}`}><WalletCards size={22} /></span><span><b>{option.name}</b><small>{option.provider ? "Detected" : "Install wallet"}</small></span>{!option.provider && <ExternalLink size={16} />}
            </button>
          ))}
        </div>
        <p className="wallet-note">Sub Stream never asks for your seed phrase or sends a transaction when you sign in.</p>
      </DialogContent>
    </Dialog>
  );
}
