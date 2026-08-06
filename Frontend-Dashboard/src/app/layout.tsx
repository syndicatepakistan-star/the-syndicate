import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import RouteWarmup from "@/components/RouteWarmup";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { DeferredCookieConsent } from "@/components/DeferredCookieConsent";
import { DeferredGtm } from "@/components/DeferredGtm";
import { DesktopBandStyles } from "@/components/DesktopBandStyles";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, getSiteUrl, SITE_NAME } from "@/lib/seo";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
} from "@/lib/structuredData";
import "./globals.css";
/* syndicate-otp.css is loaded only in OTP / checkout / affiliate-login layouts — not on marketing pages. */

const googleVerification = (process.env.GOOGLE_SITE_VERIFICATION ?? "").trim();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: DEFAULT_SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "The Syndicate",
    "The Syndicate vault",
    "Syndicate Money Mastery",
    "Syndicate Trading",
    "Syndicate business models",
    "Syndicate behaviour psychology",
    "Syndicate faceless YouTube pack",
    "business education",
    "AI Content Automation",
    "Agentic AI",
    "The Knight membership",
    "n8n automation",
    "technical analysis trading",
  ],
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteUrl(),
    siteName: SITE_NAME,
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE_PATH), alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Site fonts: Thryon (headings) + CS Daine Mono (body/digits) — woff2 */}
        <link
          rel="preload"
          href="/fonts/CSDaineMono-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Thryon.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
      </head>
      <body className="min-h-screen min-w-0 overflow-x-hidden bg-black text-white antialiased" suppressHydrationWarning>
        <DesktopBandStyles />
        <DeferredGtm />
        <Providers>
          <ServiceWorkerRegister />
          <RouteWarmup />
          {children}
          <DeferredCookieConsent />
        </Providers>
      </body>
    </html>
  );
}
