/** Strip legacy `stripe_session:…|Product title` affiliate sale labels. */
export function formatAffiliateSubscriptionLabel(raw: string | null | undefined): string {
  const name = (raw ?? "").trim();
  if (!name) return "";
  if (name.startsWith("stripe_session:")) {
    const pipe = name.indexOf("|");
    if (pipe >= 0) return name.slice(pipe + 1).trim();
    return "";
  }
  return name
    .split("·")
    .map((part) => {
      const segment = part.trim();
      if (segment.startsWith("stripe_session:")) {
        const pipe = segment.indexOf("|");
        return pipe >= 0 ? segment.slice(pipe + 1).trim() : "";
      }
      return segment;
    })
    .filter(Boolean)
    .join(" · ");
}

export function formatAffiliateSubscriptionLabels(
  primary: string | null | undefined,
  extras?: readonly (string | null | undefined)[] | null
): string | null {
  const seen = new Set<string>();
  const parts: string[] = [];
  const candidates = [primary, ...(extras ?? [])];
  for (const raw of candidates) {
    const formatted = formatAffiliateSubscriptionLabel(raw);
    for (const segment of formatted.split("·")) {
      const title = segment.trim();
      const key = title.toLowerCase();
      if (title && !seen.has(key)) {
        seen.add(key);
        parts.push(title);
      }
    }
  }
  return parts.length ? parts.join(" · ") : null;
}
