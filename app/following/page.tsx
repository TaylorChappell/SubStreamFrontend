import type { Metadata } from "next";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { FollowingFeed } from "@/components/following-feed";

export const metadata: Metadata = { title: "Following", description: "See live AQUA communities you follow." };

export default function FollowingPage() {
  return <div className="app-shell"><AppHeader /><main className="simple-page"><div className="page-heading"><p className="eyebrow">Your feed</p><h1>Following</h1><p>Live channels from the coins you care about.</p></div><FollowingFeed /></main><AppFooter /></div>;
}
