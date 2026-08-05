import { getSyndicateUser, getSyndicateUserId } from "./syndicateAuth";

/** Navbar / shell profile — legacy global keys (used only before session / migration). */
export const PROFILE_DISPLAY_NAME_KEY = "dashboarded:profileDisplayName";
export const PROFILE_AVATAR_STORAGE_KEY = "dashboarded:profileAvatar";

const SHELL_PROFILE_V1 = "dashboarded:shell:v1";

export function shellProfileStorageNamespace(
  emailHint?: string | null,
  userIdHint?: number | null | undefined
): string {
  if (typeof window === "undefined") return "anon";
  const uid =
    typeof userIdHint === "number" && Number.isFinite(userIdHint) && userIdHint > 0
      ? Math.floor(userIdHint)
      : getSyndicateUserId();
  if (uid != null && uid > 0) return `u${uid}`;
  const em = (emailHint ?? getSyndicateUser()?.email ?? "").trim().toLowerCase();
  if (em) return `e:${em.replace(/[^a-z0-9@._-]+/g, "_")}`;
  return "anon";
}

export function shellProfileDisplayKey(ns: string) {
  return `${SHELL_PROFILE_V1}:displayName:${ns}`;
}

export function shellProfileAvatarKey(ns: string) {
  return `${SHELL_PROFILE_V1}:avatar:${ns}`;
}

export const DEFAULT_DASHBOARD_PROFILE_NAME = "Member";
export const DEFAULT_DASHBOARD_PROFILE_AVATAR = "/assets/a-sm.webp";

/** Same-tab sync: Syndicate Mode listens after header profile save. */
export const DASHBOARD_PROFILE_UPDATED_EVENT = "dashboarded:profileUpdated";

export function notifyDashboardProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DASHBOARD_PROFILE_UPDATED_EVENT));
}

/**
 * After OTP login: migrate legacy global profile into per-user keys, seed name only if none saved,
 * then clear legacy globals so another account on this browser does not inherit them.
 */
export function syncShellProfileAfterLogin(email: string, userId?: number | null) {
  if (typeof window === "undefined") return;
  const em = email.trim().toLowerCase();
  if (!em) return;
  const ns = shellProfileStorageNamespace(em, userId ?? null);
  if (ns === "anon") return;

  const dKey = shellProfileDisplayKey(ns);
  const aKey = shellProfileAvatarKey(ns);

  let name = window.localStorage.getItem(dKey)?.trim();
  if (!name) {
    const legacy = window.localStorage.getItem(PROFILE_DISPLAY_NAME_KEY)?.trim();
    if (legacy) {
      window.localStorage.setItem(dKey, legacy);
      name = legacy;
    }
  }
  if (!name) {
    const label = displayNameFromEmail(em);
    if (label) window.localStorage.setItem(dKey, label);
  }

  let avatar = window.localStorage.getItem(aKey)?.trim();
  if (!avatar) {
    const legacyA = window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY)?.trim();
    if (legacyA) {
      window.localStorage.setItem(aKey, legacyA);
      avatar = legacyA;
    }
  }

  try {
    window.localStorage.removeItem(PROFILE_DISPLAY_NAME_KEY);
    window.localStorage.removeItem(PROFILE_AVATAR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function writeDashboardProfileDisplayName(trimmed: string) {
  if (typeof window === "undefined") return;
  const ns = shellProfileStorageNamespace();
  if (ns !== "anon") window.localStorage.setItem(shellProfileDisplayKey(ns), trimmed);
  else window.localStorage.setItem(PROFILE_DISPLAY_NAME_KEY, trimmed);
}

export function writeDashboardProfileAvatarRaw(raw: string) {
  if (typeof window === "undefined") return;
  const ns = shellProfileStorageNamespace();
  const t = raw.trim();
  if (t) {
    if (ns !== "anon") window.localStorage.setItem(shellProfileAvatarKey(ns), t);
    else window.localStorage.setItem(PROFILE_AVATAR_STORAGE_KEY, t);
  } else {
    if (ns !== "anon") window.localStorage.removeItem(shellProfileAvatarKey(ns));
    else window.localStorage.removeItem(PROFILE_AVATAR_STORAGE_KEY);
  }
}

export function readDashboardProfileDisplayName(): string {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_PROFILE_NAME;
  try {
    const ns = shellProfileStorageNamespace();
    if (ns !== "anon") {
      const key = shellProfileDisplayKey(ns);
      let scoped = window.localStorage.getItem(key)?.trim();
      if (!scoped) {
        const legacy = window.localStorage.getItem(PROFILE_DISPLAY_NAME_KEY)?.trim();
        if (legacy) {
          window.localStorage.setItem(key, legacy);
          window.localStorage.removeItem(PROFILE_DISPLAY_NAME_KEY);
          scoped = legacy;
        }
      }
      if (scoped) return scoped;
      return DEFAULT_DASHBOARD_PROFILE_NAME;
    }
    return window.localStorage.getItem(PROFILE_DISPLAY_NAME_KEY)?.trim() || DEFAULT_DASHBOARD_PROFILE_NAME;
  } catch {
    return DEFAULT_DASHBOARD_PROFILE_NAME;
  }
}

export function readDashboardProfileAvatarStorageRaw(): string {
  if (typeof window === "undefined") return "";
  try {
    const ns = shellProfileStorageNamespace();
    if (ns !== "anon") {
      const key = shellProfileAvatarKey(ns);
      let scoped = window.localStorage.getItem(key)?.trim();
      if (!scoped) {
        const legacy = window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY)?.trim();
        if (legacy) {
          window.localStorage.setItem(key, legacy);
          window.localStorage.removeItem(PROFILE_AVATAR_STORAGE_KEY);
          scoped = legacy;
        }
      }
      if (scoped) return scoped;
      return "";
    }
    return window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

/** Value for `<img src>` — matches main dashboard shell (paths, https, data URLs). */
export function resolveDashboardAvatarDisplayUrl(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return DEFAULT_DASHBOARD_PROFILE_AVATAR;
  if (t === "/assets/a.webp") return DEFAULT_DASHBOARD_PROFILE_AVATAR;
  if (t.startsWith("data:image/")) return t;
  if (t.startsWith("/")) return t;
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:") return t;
  } catch {
    /* ignore */
  }
  return DEFAULT_DASHBOARD_PROFILE_AVATAR;
}

/**
 * Human-friendly label from an email address: local-part only, no domain
 * (`user@gmail.com` → `User`). Splits on `.` / `_` / `-` and title-cases segments.
 */
export function displayNameFromEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  const local = (at === -1 ? trimmed : trimmed.slice(0, at)).trim();
  if (!local) return "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (!parts.length) return "";
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
