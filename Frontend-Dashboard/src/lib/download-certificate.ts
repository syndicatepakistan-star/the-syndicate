'use client'

import { buildCredentialOverview, type SynCertificateCardProps } from '@/components/SynCertificateCard'

export type DownloadSynCertificateInput = SynCertificateCardProps & {
  filenameStem: string
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 150)
      })
    })
  })
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          const done = () => {
            img.removeEventListener('load', done)
            img.removeEventListener('error', done)
            resolve()
          }
          img.addEventListener('load', done)
          img.addEventListener('error', done)
          window.setTimeout(done, 3000)
        }),
    ),
  )
}

function waitForDimensions(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    let attempts = 0
    const check = () => {
      if (element.offsetWidth > 0 && element.offsetHeight > 0) {
        resolve()
        return
      }
      attempts += 1
      if (attempts >= 40) {
        resolve()
        return
      }
      window.setTimeout(check, 50)
    }
    check()
  })
}

function triggerPngDownload(dataUrl: string, filenameStem: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${filenameStem}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Capture a mounted certificate card element and download as PNG. */
export async function captureSynCertificatePng(
  element: HTMLElement,
  filenameStem: string,
): Promise<void> {
  await waitForPaint()
  await waitForDimensions(element)
  await waitForImages(element)

  const width = element.offsetWidth
  const height = element.offsetHeight
  if (width < 1 || height < 1) {
    throw new Error(`Certificate has no layout (${width}x${height})`)
  }

  const captureOpts = {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#070a1a',
    width,
    height,
    style: {
      transform: 'none',
      opacity: '1',
    },
  }

  try {
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(element, captureOpts)
    triggerPngDownload(dataUrl, filenameStem)
    return
  } catch (primaryErr) {
    console.warn('html-to-image failed, trying html2canvas:', primaryErr)
  }

  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#070a1a',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
    })
    triggerPngDownload(canvas.toDataURL('image/png'), filenameStem)
  } catch (fallbackErr) {
    console.error('Certificate capture failed:', fallbackErr)
    throw fallbackErr
  }
}

export function buildCertificateFilenameStem(playlistTitle: string, certificateId: string): string {
  const safeCourse = (playlistTitle || 'course').replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-')
  const safeId = (certificateId || 'token').replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-')
  return `SYN-Certificate-${safeCourse}-${safeId}`
}

export function formatCertificateIssuedOn(issuedAt: string): string {
  if (!issuedAt) {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  const parsed = new Date(issuedAt)
  if (Number.isNaN(parsed.getTime())) {
    return issuedAt
  }
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export { buildCertificateVerifyUrl } from '@/lib/certificate-public-url'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** SVG fallback when DOM capture fails (same data as preview card). */
export async function downloadSynCertificateSvgFallback(
  input: DownloadSynCertificateInput,
  assetBaseUrl: string,
): Promise<void> {
  const owner = escapeXml(input.ownerName || 'Member')
  const course = escapeXml(input.courseTitle || 'Syndicate Program')
  const certId = escapeXml(input.certificateId)
  const issued = escapeXml(input.issuedOn)
  const overview = escapeXml(buildCredentialOverview(input.courseTitle || 'Syndicate Program'))
  const safeBase = escapeXml(assetBaseUrl.replace(/\/$/, ''))

  const QRCode = (await import('qrcode')).default
  const qrDataUrl = escapeXml(
    await QRCode.toDataURL(input.certificateId || 'SYN-TOKEN', {
      margin: 2,
      width: 100,
      color: { dark: '#67e8f9', light: '#050a14' },
    }),
  )

  const w = 760
  const h = 1100
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#070a1a"/>
  <image href="${safeBase}/assets/logo.webp" x="24" y="28" width="130" height="52"/>
  <text x="170" y="58" fill="#fdd02f" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="2">MONEY · POWER · HONOUR · FREEDOM</text>
  <text x="${w / 2}" y="118" fill="#cffafe" font-family="Arial,sans-serif" font-size="36" font-weight="700" text-anchor="middle">SYN TOKEN</text>
  <text x="${w / 2}" y="142" fill="#dbeafe" font-family="Arial,sans-serif" font-size="11" text-anchor="middle" letter-spacing="3">OF ACHIEVEMENT</text>
  <rect x="24" y="162" width="712" height="88" rx="12" fill="rgba(9,13,35,0.5)" stroke="#e879f9" stroke-width="1.5"/>
  <text x="40" y="186" fill="#bde8ff" font-family="Arial,sans-serif" font-size="10" letter-spacing="2">TOKEN OWNER</text>
  <text x="40" y="218" fill="#fdd02f" font-family="Arial,sans-serif" font-size="26" font-weight="700">${owner}</text>
  <text x="40" y="242" fill="#bde8ff" font-family="Arial,sans-serif" font-size="11">${course}</text>
  <rect x="24" y="262" width="712" height="120" rx="10" fill="rgba(5,8,22,0.55)" stroke="#e879f9" stroke-width="1.5"/>
  <text x="40" y="284" fill="#bde8ff" font-family="Arial,sans-serif" font-size="10" letter-spacing="1.5">CREDENTIAL OVERVIEW</text>
  <foreignObject x="36" y="292" width="688" height="82">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:12px;line-height:1.45;color:#e0f2fe;">${overview}</div>
  </foreignObject>
  <rect x="24" y="392" width="346" height="52" rx="8" fill="rgba(0,0,0,0.36)" stroke="#e879f9" stroke-width="1.5"/>
  <text x="40" y="412" fill="#bde8ff" font-family="Arial,sans-serif" font-size="9" letter-spacing="1.5">ISSUED</text>
  <text x="40" y="432" fill="#e2f4ff" font-family="Arial,sans-serif" font-size="12">${issued}</text>
  <rect x="390" y="392" width="346" height="52" rx="8" fill="rgba(0,0,0,0.36)" stroke="#e879f9" stroke-width="1.5"/>
  <text x="406" y="412" fill="#bde8ff" font-family="Arial,sans-serif" font-size="9" letter-spacing="1.5">STATUS</text>
  <text x="406" y="432" fill="#9bf38d" font-family="Arial,sans-serif" font-size="12" font-weight="700">Verified</text>
  <rect x="24" y="454" width="712" height="40" rx="8" fill="rgba(0,0,0,0.36)" stroke="#e879f9" stroke-width="1.5"/>
  <text x="40" y="474" fill="#bde8ff" font-family="Arial,sans-serif" font-size="9" letter-spacing="1.5">TOKEN ID</text>
  <text x="120" y="478" fill="#dff7ff" font-family="monospace" font-size="13">${certId}</text>
  <image href="${safeBase}/assets/coin-gold.png" x="120" y="510" width="140" height="140"/>
  <text x="190" y="668" fill="#bde8ff" font-family="Arial,sans-serif" font-size="9" text-anchor="middle" letter-spacing="2">SYNDICATE CREDENTIAL TOKEN</text>
  <image href="${qrDataUrl}" x="520" y="520" width="100" height="100"/>
  <text x="570" y="636" fill="#bde8ff" font-family="Arial,sans-serif" font-size="8" text-anchor="middle">SCAN · VERIFY ON-CHAIN</text>
</svg>`

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${input.filenameStem}.svg`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadSynCertificate(
  element: HTMLElement | null,
  input: DownloadSynCertificateInput,
  assetBaseUrl: string,
): Promise<'png' | 'svg'> {
  if (element) {
    try {
      await captureSynCertificatePng(element, input.filenameStem)
      return 'png'
    } catch (err) {
      console.warn('PNG capture failed, using SVG fallback:', err)
    }
  }
  await downloadSynCertificateSvgFallback(input, assetBaseUrl)
  return 'svg'
}
