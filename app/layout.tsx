import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import SunMark from "@/components/SunMark";
import "./globals.css";

// next/font downloads these at build time and serves them from our own site.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solcraft",
  description:
    "Find recurring cultural gatherings in Atlanta, show up, and keep coming back.",
};

export const viewport: Viewport = {
  themeColor: "#0E1024",
};

// Every page is rendered inside this layout.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" className="brand">
              <SunMark size={36} strokeWidth={4} />
              Solcraft
            </Link>
          </div>
        </header>
        <main id="main" className="shell">
          {children}
        </main>
      </body>
    </html>
  );
}
