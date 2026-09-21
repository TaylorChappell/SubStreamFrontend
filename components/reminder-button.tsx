"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CalendarCheck, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export function ReminderButton({ scheduleId }: { scheduleId: string }) {
  const subscribe = useCallback((onChange: () => void) => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ scheduleId: string; enabled: boolean }>).detail;
      if (!detail || detail.scheduleId === scheduleId) onChange();
    };
    window.addEventListener("substream:reminder", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("substream:reminder", sync); window.removeEventListener("storage", sync); };
  }, [scheduleId]);
  const saved = useSyncExternalStore(subscribe, () => localStorage.getItem(`substream.reminder.${scheduleId}`) === "1", () => false);
  const toggle = () => {
    const next = !saved;
    if (next) localStorage.setItem(`substream.reminder.${scheduleId}`, "1"); else localStorage.removeItem(`substream.reminder.${scheduleId}`);
    window.dispatchEvent(new CustomEvent("substream:reminder", { detail: { scheduleId, enabled: next } }));
    toast.success(next ? "Reminder saved on this device" : "Reminder removed");
  };
  return <button type="button" onClick={toggle}>{saved ? <CalendarCheck size={16} /> : <CalendarDays size={16} />}{saved ? "Reminder set" : "Remind me"}</button>;
}
