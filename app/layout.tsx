import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Figtree } from "next/font/google";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { MAIN_CONTENT_ID, SkipLink } from "@/components/layout/SkipLink";
import { palette } from "@/lib/design/tokens";
import "./globals.css";

/** Figtree (variable 300–900). Sets `--font-sans` on <html>; Tailwind's `font-sans` reads it. */
const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

function siteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Nordvra | Vi bokar städning och hantverkare åt dig",
    template: "%s | Nordvra",
  },
  description:
    "Vi bokar städning, flytthjälp och hantverkare åt dig, med RUT- och ROT-avdrag. Se ungefärligt pris före och efter avdrag direkt. Ingen bokningsavgift.",
  applicationName: "Nordvra",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Nordvra",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: palette.brand,
  colorScheme: "light",
};

/**
 * Root layout. Kept free of request-time APIs (cookies, headers, searchParams, current time)
 * so every public page can be prerendered.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv" className={figtree.variable}>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-ink antialiased">
        <SkipLink />
        <PublicChrome>
          <Header />
        </PublicChrome>
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
          {children}
        </main>
        <PublicChrome>
          <Footer />
        </PublicChrome>
        <PublicChrome>
          <CookieBanner />
        </PublicChrome>
      </body>
    </html>
  );
}
