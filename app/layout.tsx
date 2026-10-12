import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { content } from "@/lib/content";
import { currentSiteUrl } from "@/lib/site-url";
import "./globals.css";

// Display: Instrument Serif, a condensed editorial serif with a lovely italic.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Body: Geist, a calm grotesque that stays legible at small sizes.
const body = Geist({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Code, file paths and numbers: Geist Mono.
const code = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: currentSiteUrl(),
  title: { default: content.metadata.title, template: `%s | ${content.siteName}` },
  description: content.metadata.description,
  openGraph: { siteName: content.siteName, type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d10" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${code.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          {content.skipLink}
        </a>
        <div className="page">
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
