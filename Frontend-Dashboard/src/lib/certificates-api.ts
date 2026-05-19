import { portalFetch, resolveClientApiUrl } from "@/lib/portal-api";

export type CertificateVerifyResult = {
  verified: boolean;
  status?: string;
  message?: string;
  token_id?: string;
  title?: string;
  course_title?: string;
  playlist_title?: string;
  holder_name?: string;
  kind?: "course" | "playlist" | string;
  issued_at?: string;
};

export type IssuedCertificateRow = {
  kind: "course" | "playlist" | string;
  certificate_id: string;
  token_id: string;
  title: string;
  name: string;
  issued_at: string | null;
};

export type IssuePlaylistCertificateResult = {
  certificate_id: string;
  token_id: string;
  playlist_id: number;
  playlist_title: string;
  holder_name: string;
  issued_at: string | null;
  created?: boolean;
};

function looksLikeHtml(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

/** Public home-page verification (no auth). */
export async function verifyCertificateToken(tokenId: string): Promise<CertificateVerifyResult> {
  const body = { token_id: tokenId.trim().toUpperCase() };
  const payload = JSON.stringify(body);

  // Next dev/prod often 308-strips trailing slashes on `/api/courses/.../` — use noslash + portal-proxy.
  const candidates = [
    typeof window !== "undefined"
      ? `${window.location.origin}/api/portal-proxy/courses/certificates/verify`
      : "",
    resolveClientApiUrl("/api/courses/certificates/verify/").replace(/\/$/, ""),
    resolveClientApiUrl("/api/courses/certificates/verify/"),
    "http://127.0.0.1:8000/api/courses/certificates/verify/",
    "http://127.0.0.1:8000/api/courses/certificates/verify",
  ].filter((url, index, arr) => url && arr.indexOf(url) === index);

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: payload,
      });
      const text = await res.text();
      if (looksLikeHtml(text)) continue;
      let data: CertificateVerifyResult;
      try {
        data = JSON.parse(text) as CertificateVerifyResult;
      } catch {
        continue;
      }
      if (typeof data.verified === "boolean") {
        return data;
      }
    } catch {
      // try next candidate
    }
  }

  return {
    verified: false,
    status: "not_certified",
    message: "Verification service is unavailable. Try again.",
  };
}

/** Logged-in: issue SYN token after playlist completion. */
export async function issuePlaylistCertificate(
  playlistId: number,
  holderName: string
): Promise<IssuePlaylistCertificateResult> {
  const res = await portalFetch<IssuePlaylistCertificateResult>(
    `/api/streaming/playlists/${playlistId}/certificate/`,
    {
      method: "POST",
      body: JSON.stringify({ holder_name: holderName.trim() }),
    }
  );
  if (!res.ok || !res.data?.token_id) {
    const detail =
      res.data && typeof res.data === "object" && "detail" in res.data
        ? String((res.data as { detail?: string }).detail || "")
        : "";
    throw new Error(detail || "Could not issue certificate. Sign in and try again.");
  }
  return res.data;
}

/** Logged-in: certificates stored in the database for this user. */
export async function fetchMyCertificates(): Promise<IssuedCertificateRow[]> {
  const res = await portalFetch<IssuedCertificateRow[]>("/api/courses/certificates/mine/");
  if (!res.ok) {
    return [];
  }
  return Array.isArray(res.data) ? res.data : [];
}
