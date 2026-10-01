/**
 * Free, offline lead-gate validation for Syn Diagnosis (after Q4).
 * Phone: libphonenumber-js (Google numbering rules). Email: strict format + junk filters.
 * No paid APIs.
 */

import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js/max";

/** Common disposable / throwaway domains (static, free — no API). */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.org",
  "sharklasers.com",
  "grr.la",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "10minutemail.com",
  "trashmail.com",
  "discard.email",
  "getnada.com",
  "maildrop.cc",
  "fakeinbox.com",
  "emailondeck.com",
  "mintemail.com",
  "moakt.com",
  "tmpmail.org",
  "tmpmail.net",
]);

/** Obvious TLD / domain typos people type often. */
const TYPO_EMAIL_SUFFIXES = [
  ".con",
  ".cpm",
  ".coom",
  ".comm",
  ".nette",
  ".og",
  ".cm",
];

const TYPO_EMAIL_DOMAINS = new Set([
  "gamil.com",
  "gmial.com",
  "gmal.com",
  "gnail.com",
  "gmai.com",
  "gmail.con",
  "gmail.co",
  "hotmal.com",
  "hotnail.com",
  "hotmail.con",
  "outlok.com",
  "outllok.com",
  "yahooo.com",
  "yaho.com",
  "icloud.con",
]);

/** Practical RFC-inspired shape (local@domain.tld). */
const EMAIL_FORMAT_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export type LeadFieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
};

/**
 * Normalize quiz dial values like "+1-684" → "+1684", "+44" → "+44".
 */
export function normalizeDialCode(countryCode: string): string {
  const raw = String(countryCode || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function nationalDigits(nationalNumber: string): string {
  let digits = String(nationalNumber || "").replace(/\D/g, "");
  // Users often type a trunk 0 (e.g. UK 07…). Drop it when dial code is present.
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

function buildInternationalCandidate(countryCode: string, nationalNumber: string): string | null {
  const dial = normalizeDialCode(countryCode);
  const digits = nationalDigits(nationalNumber);
  if (!dial || !digits) return null;
  return `${dial}${digits}`;
}

export function isValidLeadEmail(email: string): boolean {
  return !getLeadEmailError(email);
}

export function getLeadEmailError(email: string): string {
  const value = String(email || "").trim().toLowerCase();
  if (!value) return "Please enter a valid email address.";
  if (value.length > 254) return "Email address is too long.";
  if (/\s/.test(value)) return "Email cannot contain spaces.";
  if (value.includes("..")) return "Please enter a valid email address.";

  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) {
    return "Please enter a valid email address.";
  }

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!local || local.length > 64) return "Please enter a valid email address.";
  if (local.startsWith(".") || local.endsWith(".")) {
    return "Please enter a valid email address.";
  }
  if (!domain || !domain.includes(".")) {
    return "Please enter a valid email address.";
  }

  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return "Please enter a valid email address.";
  }

  if (!EMAIL_FORMAT_REGEX.test(value)) {
    return "Please enter a valid email address.";
  }

  for (const suffix of TYPO_EMAIL_SUFFIXES) {
    if (value.endsWith(suffix)) {
      return "Please check your email — that domain looks mistyped.";
    }
  }
  if (TYPO_EMAIL_DOMAINS.has(domain)) {
    return "Please check your email — that domain looks mistyped.";
  }
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return "Please use a permanent email (not a temporary inbox).";
  }

  return "";
}

export function isValidLeadPhone(countryCode: string, nationalNumber: string): boolean {
  return !getLeadPhoneError(countryCode, nationalNumber);
}

export function getLeadPhoneError(countryCode: string, nationalNumber: string): string {
  if (!normalizeDialCode(countryCode)) {
    return "Please select a country code.";
  }
  const digits = nationalDigits(nationalNumber);
  if (!digits) return "Please enter a valid phone number.";
  if (digits.length < 4) return "Phone number is too short.";
  if (digits.length > 15) return "Phone number is too long.";

  const junk = junkPhoneError(digits);
  if (junk) return junk;

  const candidate = buildInternationalCandidate(countryCode, nationalNumber);
  if (!candidate) return "Please enter a valid phone number.";

  const junkIntl = junkPhoneError(candidate.replace(/\D/g, ""));
  if (junkIntl) return junkIntl;

  try {
    if (!isValidPhoneNumber(candidate)) {
      return "Please enter a valid phone number for the selected country.";
    }
  } catch {
    return "Please enter a valid phone number for the selected country.";
  }

  return "";
}

/** Block same-digit / sequential / placeholder numbers before libphonenumber. */
export function junkPhoneError(rawDigits: string): string {
  const digits = String(rawDigits || "").replace(/\D/g, "");
  if (!digits) return "Please enter a valid phone number.";

  const core = digits.length >= 10 ? digits.slice(-10) : digits;
  if (core.length < 7) return "";

  if (new Set(core).size === 1) {
    return "Please enter a real phone number (not the same digit repeated).";
  }
  if (new Set(core).size < 3) {
    return "Please enter a real phone number.";
  }
  if (isSequentialDigits(core)) {
    return "Please enter a real phone number (not a sequential pattern).";
  }

  const placeholders = new Set([
    "1234567890",
    "0123456789",
    "0987654321",
    "9876543210",
    "1111111111",
    "0000000000",
    "2222222222",
    "5555555555",
    "123456789",
    "012345678",
    "1234567",
    "7654321",
  ]);
  if (placeholders.has(core) || placeholders.has(digits)) {
    return "Please enter a real phone number.";
  }

  return "";
}

function isSequentialDigits(digits: string): boolean {
  if (digits.length < 7) return false;
  let asc = 0;
  let desc = 0;
  for (let i = 1; i < digits.length; i += 1) {
    const a = Number(digits[i - 1]);
    const b = Number(digits[i]);
    if ((b - a + 10) % 10 === 1) asc += 1;
    if ((a - b + 10) % 10 === 1) desc += 1;
  }
  const threshold = digits.length - 2;
  return asc >= threshold || desc >= threshold;
}

/** E.164 for Klaviyo / CRM (+447…); null if invalid. */
export function toE164(countryCode: string, nationalNumber: string): string | null {
  const candidate = buildInternationalCandidate(countryCode, nationalNumber);
  if (!candidate) return null;
  try {
    const parsed = parsePhoneNumberFromString(candidate);
    return parsed?.isValid() ? parsed.format("E.164") : null;
  } catch {
    return null;
  }
}

/**
 * Validate the full Q4 contact step. Returns "" when OK, else first error message.
 */
export function validateLeadContact(input: {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
}): string {
  const name = String(input.name || "").trim();
  if (name.length < 2) return "Please enter your name to continue.";

  const emailError = getLeadEmailError(input.email);
  if (emailError) return emailError;

  const phoneError = getLeadPhoneError(input.countryCode, input.phone);
  if (phoneError) return phoneError;

  return "";
}
