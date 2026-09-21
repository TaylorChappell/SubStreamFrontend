"use client";
import { CalendarPlus } from 'lucide-react';
import type { Schedule } from '@/lib/types';
const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r/g, '');
const stamp = (time: number) => new Date(time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export function ReminderButton({ schedule }: { schedule: Schedule }) {
  function download() {
    const content = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sub Stream//Schedule//EN','BEGIN:VEVENT','UID:'+schedule.id+'@substream','DTSTAMP:'+stamp(Date.now()),'DTSTART:'+stamp(schedule.scheduledFor),'DTEND:'+stamp(schedule.scheduledFor + schedule.durationMinutes * 60000),'SUMMARY:'+escape(schedule.title),'DESCRIPTION:'+escape(schedule.description || ''),'URL:'+window.location.origin+'/stream/'+encodeURIComponent(schedule.slug || ''),'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:'+escape(schedule.title),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'sub-stream-'+schedule.id+'.ics'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <button type="button" onClick={download} title="Download a calendar event with a 10-minute reminder"><CalendarPlus size={16}/>Add to calendar</button>;
}
