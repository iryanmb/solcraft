import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
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
  // Lets the layout reach the screen edges on iPhone; .screen pads around the home bar.
  viewportFit: "cover",
};

// Every page is rendered inside this layout.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
