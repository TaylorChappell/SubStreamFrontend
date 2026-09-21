import type { Metadata } from "next";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { CreatorStudio } from "@/components/creator-studio";

export const metadata: Metadata = { title: "Creator studio", description: "Create and manage live channels for coins you launched on AQUA." };

export default function StudioPage() {
  return <div className="app-shell"><AppHeader /><main className="studio-page"><div className="studio-page-heading"><p className="eyebrow"><span className="live-pulse" /> Broadcast control</p><h1>Creator studio</h1><p>Manage your channel, stream key, announcements, and upcoming shows from one place.</p></div><CreatorStudio /></main><AppFooter /></div>;
}
