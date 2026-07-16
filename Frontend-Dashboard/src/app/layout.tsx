import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import RouteWarmup from "@/components/RouteWarmup";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, getSiteUrl, SITE_NAME } from "@/lib/seo";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
} from "@/lib/structuredData";
import "./globals.css";
import "./syndicate-otp/syndicate-otp.css";

const GTM_ID = "GTM-WBW2KZV6";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/CS%20Daine%20Mono/CSDaineMono-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/fonts/Thryon.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
      </head>
      <body
        className={`${jetbrainsMono.variable} min-h-screen min-w-0 overflow-x-hidden bg-black text-white antialiased`}
        suppressHydrationWarning
      >
        {/* GTM after first paint — avoids render-blocking / TBT hit on marketing + quiz. */}
        <Script id="google-tag-manager" strategy="lazyOnload">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          <ServiceWorkerRegister />
          <RouteWarmup />
          {children}
        </Providers>
      </body>
    </html>
  );
}
