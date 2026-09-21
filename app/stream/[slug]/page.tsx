import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { StreamRoom } from '@/components/stream-room';
export const metadata = { title: 'Stream room', description: 'Watch an AQUA creator and join holder chat.' };
export default async function Page({ params }: { params: Promise<{ slug:string }> }) { const {slug}=await params; return <><AppHeader/><StreamRoom slug={slug}/><AppFooter/></>; }
