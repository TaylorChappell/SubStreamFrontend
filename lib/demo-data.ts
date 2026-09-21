import type { ChatMessage, Schedule, Stream } from "./types";

const now = Date.now();
const colors = { tidal: "#19d8e6", shark: "#6f9bff", pearl: "#ff8f83", drift: "#a7f56c" } as const;

function chart(base: number) {
  return [0.82,0.88,0.86,0.94,0.91,1.02,1.08,1.04,1.15,1.11,1.18,1.23].map((value, index) => ({ time: now - (11-index)*300000, priceUsd: base*value, marketCapUsd: base*value*58_800_000 }));
}

export const demoStreams: Stream[] = [
  {
    id: "12c75bb4-2041-484a-9bab-a8c89ebc8901", slug: "tidal", title: "Building the next rewards dashboard", description: "Product walkthrough, holder questions and a first look at what ships this week.", category: "Development", status: "live", viewerCount: 184, liveStartedAt: now-48*60000, provider: "demo", announcement: "AMA starts in 10 minutes. Drop your holder questions in chat.", followerCount: 683, chart: chart(.0041),
    market: { id: "demo-tidal", mint: "AQVcP67EpMyu4cBZZjqMu91cVsWy1aX98JmcZm1FyY9", name: "Tidal", symbol: "TIDAL", creatorWallet: "11111111111111111111111111111111", rewardMode: "holder_rewards", priceUsd: .00483, marketCapUsd: 284000, volume24hUsd: 48300, change24h: 14.8, holderCount: 1842, aquaUrl: "https://aqua-launchpad.xyz/market/demo-tidal" },
  },
  {
    id: "12c75bb4-2041-484a-9bab-a8c89ebc8902", slug: "shark", title: "Community AMA and roadmap vote", description: "Open questions from SHARK holders and this month's roadmap decisions.", category: "AMA", status: "live", viewerCount: 82, liveStartedAt: now-31*60000, provider: "demo", followerCount: 401, chart: chart(.0017),
    market: { id: "demo-shark", mint: "So11111111111111111111111111111111111111112", name: "Shark DAO", symbol: "SHARK", creatorWallet: "11111111111111111111111111111111", rewardMode: "hourly_jackpot", priceUsd: .0019, marketCapUsd: 119000, volume24hUsd: 22100, change24h: 6.2, holderCount: 976, aquaUrl: "https://aqua-launchpad.xyz/market/demo-shark" },
  },
  {
    id: "12c75bb4-2041-484a-9bab-a8c89ebc8903", slug: "pearl", title: "Live art reveal for holders", description: "A live reveal of the next PEARL collection.", category: "Art", status: "live", viewerCount: 37, liveStartedAt: now-22*60000, provider: "demo", followerCount: 288, chart: chart(.00068),
    market: { id: "demo-pearl", mint: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", name: "Pearl Studio", symbol: "PEARL", creatorWallet: "11111111111111111111111111111111", rewardMode: "buyback_burn", priceUsd: .00076, marketCapUsd: 76000, volume24hUsd: 9400, change24h: 3.9, holderCount: 622, aquaUrl: "https://aqua-launchpad.xyz/market/demo-pearl" },
  },
  {
    id: "12c75bb4-2041-484a-9bab-a8c89ebc8904", slug: "drift", title: "Weekly product build stream", description: "Building the DRIFT community tools in public.", category: "Development", status: "live", viewerCount: 21, liveStartedAt: now-15*60000, provider: "demo", followerCount: 193, chart: chart(.00051),
    market: { id: "demo-drift", mint: "SysvarRent111111111111111111111111111111111", name: "Drift Works", symbol: "DRIFT", creatorWallet: "11111111111111111111111111111111", rewardMode: "holder_rewards", priceUsd: .00048, marketCapUsd: 48000, volume24hUsd: 5100, change24h: -1.3, holderCount: 391, aquaUrl: "https://aqua-launchpad.xyz/market/demo-drift" },
  },
];

export const streamColors: Record<string,string> = colors;

export const demoMessages: ChatMessage[] = [
  { id: 1, wallet: "7Wq9x2P", username: "current", body: "The new rewards view is much cleaner.", role: "holder", createdAt: now-120000 },
  { id: 2, wallet: "11111111111111111111111111111111", username: "Tidal Labs", body: "We also moved claims into one transaction.", role: "creator", createdAt: now-90000 },
  { id: 3, wallet: "9bRK8m", username: "nori", body: "Will the mobile version ship this week?", role: "holder", createdAt: now-45000 },
  { id: 4, wallet: "11111111111111111111111111111111", username: "Tidal Labs", body: "Yes. Mobile is in the same release.", role: "creator", createdAt: now-18000 },
];

export const demoSchedules: Schedule[] = [
  { id: "schedule-wave", title: "WAVE weekly build update", description: "Development progress and holder questions", scheduledFor: now+86400000, durationMinutes: 60, marketId: "demo-wave", marketName: "Wave Labs", symbol: "WAVE", slug: null },
  { id: "schedule-shark", title: "SHARK community game night", description: "Community games and prizes", scheduledFor: now+3*86400000, durationMinutes: 90, marketId: "demo-shark", marketName: "Shark DAO", symbol: "SHARK", slug: "shark" },
];

export function demoStream(slug: string) { return demoStreams.find((stream) => stream.slug === slug) ?? demoStreams[0]!; }
