import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { content } from "@/lib/content";
import { currentSiteUrl } from "@/lib/site-url";
import "./globals.css";

// Archivo, from Omnibus-Type: a grotesque with a width axis, so headlines can
// run wide and black like a poster while body text stays plain.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Code, file paths and numbers.
const code = JetBrains_Mono({
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
    { media: "(prefers-color-scheme: light)", color: "#f2efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${code.variable}`}>
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
