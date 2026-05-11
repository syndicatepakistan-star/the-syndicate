import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import RouteWarmup from "@/components/RouteWarmup";
import "./globals.css";
import "./syndicate-otp/syndicate-otp.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "THE SYNDICATE",
  description: "THE SYNDICATE",
  icons: {
    icon: "/assets/logo.png",
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png"
  }
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
        <link rel="preload" href="/assets/logo.webp" as="image" />
      </head>
      <body
        className={`${jetbrainsMono.variable} min-h-screen min-w-0 overflow-x-hidden bg-black text-white antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <RouteWarmup />
          {children}
        </Providers>
      </body>
    </html>
  );
}

