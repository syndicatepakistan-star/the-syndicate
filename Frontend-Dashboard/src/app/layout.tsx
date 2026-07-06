import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import RouteWarmup from "@/components/RouteWarmup";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, getSiteUrl, SITE_NAME } from "@/lib/seo";
import "./globals.css";
import "./syndicate-otp/syndicate-otp.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

const defaultTitle = "The Syndicate — Business Education & Elite Operator Training";
const defaultDescription =
  "The Syndicate delivers elite business education: money mastery, trading vaults, AI automation, and operator-grade programs for builders who refuse mediocrity.";

const googleVerification = (process.env.GOOGLE_SITE_VERIFICATION ?? "").trim();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: defaultDescription,
  applicationName: SITE_NAME,
  keywords: [
    "The Syndicate",
    "business education",
    "trading course",
    "money mastery",
    "AI automation",
    "entrepreneur training",
    "elite programs",
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
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE_PATH), alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
  icons: {
    icon: "/assets/logo.png",
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
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
      </head>
      <body
        className={`${jetbrainsMono.variable} min-h-screen min-w-0 overflow-x-hidden bg-black text-white antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <ServiceWorkerRegister />
          <RouteWarmup />
          {children}
        </Providers>
      </body>
    </html>
  );
}

