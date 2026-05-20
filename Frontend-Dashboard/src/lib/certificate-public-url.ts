/** Origin used in certificate QR codes (must be your real public frontend URL). */
export function getPublicSiteOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '')
  }

  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '').trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const vercel = (process.env.VERCEL_URL ?? '').trim()
  if (vercel) {
    return `https://${vercel.replace(/\/$/, '')}`
  }

  return 'http://localhost:3000'
}

/** Public URL opened when scanning the certificate QR code. */
export function buildCertificateVerifyUrl(certificateId: string, origin?: string): string {
  const base = (origin ?? getPublicSiteOrigin()).replace(/\/$/, '')
  const token = certificateId.trim()
  return `${base}/verify?certificate=${encodeURIComponent(token)}`
}
