import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { ExploreFeed } from '@/components/explore-feed';
export default function Home() { return <div className="app-shell"><AppHeader/><main className="section live-section"><ExploreFeed/></main><AppFooter/></div>; }
