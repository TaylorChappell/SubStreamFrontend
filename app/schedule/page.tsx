import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { ScheduleList } from '@/components/schedule-list';
export const metadata = { title: 'Stream schedule' };
export default function Page() { return <><AppHeader/><main className="simple-page"><div className="page-heading"><h1>Stream schedule</h1><p>Upcoming broadcasts. Times are shown in your timezone.</p></div><ScheduleList/></main><AppFooter/></>; }
