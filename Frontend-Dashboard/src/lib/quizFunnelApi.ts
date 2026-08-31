import { getSyndicateApiBase } from "@/lib/syndicateApiBase";

const REQUEST_TIMEOUT_MS = 10000;
/** Fast submit saves score immediately; AI report is generated in the background. */
const SUBMIT_TIMEOUT_MS = 20000;
const REPORT_POLL_INTERVAL_MS = 2500;
const REPORT_POLL_MAX_ATTEMPTS = 48;

function buildApiUrl(path: string): string {
  const base = getSyndicateApiBase().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please check backend connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchQuestions(): Promise<
  Array<{ id: number; question: string; options: string[] }>
> {
  const response = await fetchWithTimeout(buildApiUrl("/quiz-questions"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch quiz questions");
  }
  return response.json();
}

export async function submitAnswers(payload: unknown): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(
    buildApiUrl("/submit-answers"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    SUBMIT_TIMEOUT_MS,
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Failed to submit quiz answers");
  }
  return response.json();
}

export type QuizResultPoll = {
  report_ready: boolean;
  ai_report?: string;
  intake_ref?: string;
  error?: string;
};

export async function fetchQuizResult(identity: {
  ref?: string;
  email?: string;
}): Promise<QuizResultPoll> {
  const params = new URLSearchParams();
  const ref = (identity.ref || "").trim();
  const email = (identity.email || "").trim();
  if (ref) params.set("ref", ref);
  if (email) params.set("email", email);
  const response = await fetchWithTimeout(buildApiUrl(`/quiz-result?${params}`), { cache: "no-store" });
  const data = (await response.json()) as QuizResultPoll;
  if (!response.ok) {
    throw new Error(data.error || "Failed to load quiz result.");
  }
  return data;
}

/** Poll until the background AI report is ready (or attempts exhausted). */
export async function waitForQuizReport(
  identity: { ref?: string; email?: string },
  onUpdate?: (aiReport: string) => void,
): Promise<string | null> {
  for (let attempt = 0; attempt < REPORT_POLL_MAX_ATTEMPTS; attempt += 1) {
    try {
      const data = await fetchQuizResult(identity);
      if (data.report_ready && data.ai_report) {
        onUpdate?.(data.ai_report);
        return data.ai_report;
      }
    } catch {
      // Keep polling — submit may have succeeded even if the first poll fails on slow networks.
    }
    await new Promise((resolve) => setTimeout(resolve, REPORT_POLL_INTERVAL_MS));
  }
  return null;
}

/** Mid-quiz lead capture (name/email/phone) — does not generate the final report. */
export async function saveQuizLead(payload: {
  name: string;
  email: string;
  phone?: string;
}): Promise<{
  ok: boolean;
  intake_ref?: string;
  intake_url?: string;
  email?: string;
  name?: string;
  phone?: string;
}> {
  const response = await fetchWithTimeout(
    buildApiUrl("/save-quiz-lead"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone || "",
        },
      }),
    },
    REQUEST_TIMEOUT_MS,
  );
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    intake_ref?: string;
    intake_url?: string;
    email?: string;
    name?: string;
    phone?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "Failed to save your details.");
  }
  return {
    ok: Boolean(data.ok),
    intake_ref: data.intake_ref,
    intake_url: data.intake_url,
    email: data.email,
    name: data.name,
    phone: data.phone,
  };
}

export type QuizIntakeQuestion = {
  id: string;
  label: string;
  placeholder: string;
};

export type QuizIntakeSession = {
  valid: boolean;
  already_submitted?: boolean;
  first_name?: string;
  questions?: QuizIntakeQuestion[];
  intake_ref?: string;
  email?: string;
  error?: string;
};

export type QuizIntakeIdentity = {
  ref?: string;
  email?: string;
};

export async function fetchIntakeSession(identity: QuizIntakeIdentity): Promise<QuizIntakeSession> {
  const params = new URLSearchParams();
  const ref = (identity.ref || "").trim();
  const email = (identity.email || "").trim();
  if (ref) params.set("ref", ref);
  if (email) params.set("email", email);
  const response = await fetchWithTimeout(buildApiUrl(`/quiz-intake?${params}`), { cache: "no-store" });
  const data = (await response.json()) as QuizIntakeSession;
  if (!response.ok) {
    return { valid: false, error: data.error || "Invalid link." };
  }
  return data;
}

export async function submitIntake(payload: {
  ref?: string;
  email?: string;
  answers: Array<{ question_id: string; answer: string }>;
}): Promise<{ ok: boolean; already_submitted?: boolean; message?: string; error?: string }> {
  const response = await fetchWithTimeout(
    buildApiUrl("/quiz-intake/submit"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    REQUEST_TIMEOUT_MS,
  );
  const data = (await response.json()) as {
    ok?: boolean;
    already_submitted?: boolean;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "Failed to submit answers.");
  }
  return {
    ok: Boolean(data.ok),
    already_submitted: data.already_submitted,
    message: data.message,
  };
}
