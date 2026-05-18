import { portalFetch } from "@/lib/portal-api";

export type SupportPriority = "normal" | "elevated" | "critical";
export type SupportStatus = "open" | "acknowledged" | "in_progress" | "resolved" | "closed";

export type SupportMessage = {
  id: string;
  body: string;
  is_staff: boolean;
  created_at: string;
};

export type SupportThread = {
  id: string;
  priority: SupportPriority;
  status: SupportStatus;
  source: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview: string;
  messages?: SupportMessage[];
};

export type SupportThreadsResponse = {
  threads: SupportThread[];
};

function extractDetail(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in (data as Record<string, unknown>)) {
    return String((data as { detail?: string }).detail ?? fallback);
  }
  return fallback;
}

export async function fetchSupportThreads(): Promise<SupportThread[]> {
  const res = await portalFetch<SupportThreadsResponse>("/api/support/threads/");
  if (!res.ok) throw new Error(extractDetail(res.data, "Could not load support history."));
  return res.data.threads ?? [];
}

export async function fetchSupportThread(threadId: string): Promise<SupportThread> {
  const res = await portalFetch<SupportThread>(`/api/support/threads/${threadId}/`);
  if (!res.ok) throw new Error(extractDetail(res.data, "Could not load conversation."));
  return res.data;
}

export async function createSupportThread(
  message: string,
  priority: SupportPriority,
  redConfirmed = false
): Promise<SupportThread> {
  const res = await portalFetch<SupportThread>("/api/support/threads/", {
    method: "POST",
    body: JSON.stringify({
      message,
      priority,
      red_confirmed: redConfirmed,
      source: "dashboard/support"
    })
  });
  if (!res.ok) throw new Error(extractDetail(res.data, "Could not submit request."));
  return res.data;
}

export async function replySupportThread(threadId: string, message: string): Promise<SupportThread> {
  const res = await portalFetch<SupportThread>(`/api/support/threads/${threadId}/`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error(extractDetail(res.data, "Could not send reply."));
  return res.data;
}
