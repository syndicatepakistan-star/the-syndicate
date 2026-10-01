"""Detect obvious fake / placeholder phone patterns (same digit, sequences, etc.)."""

from __future__ import annotations


def national_digits_only(raw: str) -> str:
    return "".join(ch for ch in (raw or "") if ch.isdigit())


def junk_phone_error(raw_phone: str) -> str:
    """
    Return a user-facing error if the number looks fake, else "".

    Checks national/international digits (ignores '+' and formatting).
    """
    digits = national_digits_only(raw_phone)
    if not digits:
        return "Please enter a valid phone number."

    # Prefer last 10–11 national-ish digits for pattern checks when country code is included.
    core = digits[-10:] if len(digits) >= 10 else digits
    if len(core) < 7:
        # Let format validators handle "too short".
        return ""

    if len(set(core)) == 1:
        return "Please enter a real phone number (not the same digit repeated)."

    if len(set(core)) < 3:
        return "Please enter a real phone number."

    if _is_sequential(core):
        return "Please enter a real phone number (not a sequential pattern)."

    # Common placeholder cores (US/UK style junk).
    placeholders = {
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
    }
    if core in placeholders or digits in placeholders:
        return "Please enter a real phone number."

    return ""


def _is_sequential(digits: str) -> bool:
    """True if digits are mostly ascending or descending by 1 (e.g. 1234567890)."""
    if len(digits) < 7:
        return False

    asc = sum(1 for i in range(1, len(digits)) if (int(digits[i]) - int(digits[i - 1])) % 10 == 1)
    desc = sum(1 for i in range(1, len(digits)) if (int(digits[i - 1]) - int(digits[i])) % 10 == 1)
    # Allow a couple of breaks; block near-perfect sequences.
    threshold = len(digits) - 2
    return asc >= threshold or desc >= threshold
