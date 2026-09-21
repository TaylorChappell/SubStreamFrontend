"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ModelContext {
  registerTool(tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute(input: unknown): unknown | Promise<unknown>;
  }, options?: { signal?: AbortSignal }): void | Promise<void>;
}

function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Input must be an object.");
  return input as Record<string, unknown>;
}

export function WebMcpTools() {
  const router = useRouter();
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const report = (error: unknown) => console.warn("Sub Stream WebMCP tool registration failed", error);

    const registrations = [
      context.registerTool({
        name: "open_live_stream",
        title: "Open live stream",
        description: "Open a Sub Stream live room by its public channel slug.",
        inputSchema: { type: "object", properties: { slug: { type: "string", minLength: 1, maxLength: 80, pattern: "^[a-z0-9-]+$" } }, required: ["slug"], additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input) {
          const slug = objectInput(input).slug;
          if (typeof slug !== "string" || !/^[a-z0-9-]{1,80}$/.test(slug)) throw new Error("Provide a valid channel slug.");
          router.push(`/stream/${slug}`);
          return { opened: true, slug };
        },
      }, { signal: lifecycle.signal }),
      context.registerTool({
        name: "save_stream_reminder",
        title: "Save stream reminder",
        description: "Save or remove a reminder for an upcoming Sub Stream schedule on this device.",
        inputSchema: { type: "object", properties: { scheduleId: { type: "string", minLength: 1, maxLength: 100 }, enabled: { type: "boolean" } }, required: ["scheduleId", "enabled"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const values = objectInput(input); const scheduleId = values.scheduleId; const enabled = values.enabled;
          if (typeof scheduleId !== "string" || !scheduleId.trim() || scheduleId.length > 100 || typeof enabled !== "boolean") throw new Error("Provide a scheduleId and enabled state.");
          const key = `substream.reminder.${scheduleId}`;
          if (enabled) localStorage.setItem(key, "1"); else localStorage.removeItem(key);
          window.dispatchEvent(new CustomEvent("substream:reminder", { detail: { scheduleId, enabled } }));
          return { scheduleId, reminderSaved: enabled };
        },
      }, { signal: lifecycle.signal }),
    ];
    registrations.forEach((registration) => void Promise.resolve(registration).catch(report));
    return () => lifecycle.abort();
  }, [router]);

  return null;
}
