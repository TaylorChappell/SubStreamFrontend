export interface Market {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  imageUrl?: string | null;
  creatorWallet: string;
  rewardMode: string;
  priceUsd: number;
  marketCapUsd: number;
  volume24hUsd: number;
  change24h: number;
  holderCount: number;
  aquaUrl: string;
}

export interface Stream {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl?: string | null;
  status: "offline" | "scheduled" | "live" | "errored";
  viewerCount: number;
  liveStartedAt: number | null;
  playerUrl?: string | null;
  provider: "cloudflare" | "demo";
  market: Market;
  announcement?: string | null;
  followerCount?: number;
  followed?: boolean;
  chart?: Array<{ time: number; priceUsd: number; marketCapUsd: number }>;
}

export interface ChatMessage {
  id: number;
  wallet: string;
  username?: string | null;
  avatarUrl?: string | null;
  body: string;
  role: "holder" | "creator" | "moderator" | "admin";
  createdAt: number;
}

export interface Schedule {
  id: string;
  title: string;
  description: string;
  scheduledFor: number;
  durationMinutes: number;
  marketId: string;
  marketName: string;
  symbol: string;
  imageUrl?: string | null;
  slug?: string | null;
}
