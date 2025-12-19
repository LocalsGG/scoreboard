import type { Metadata } from "next";
import { getSupabaseStorageUrl } from "@/lib/assets";
import "./globals.css";

const faviconUrl = `${getSupabaseStorageUrl()}/favicon.ico`;

export const metadata: Metadata = {
  title: {
    default: "Scoreboardtools - Live Scoreboard Overlays for Streaming",
    template: "%s | Scoreboardtools",
  },
  description: "Create live scoreboard overlays for esports streaming. Works with OBS, Streamlabs, vMix, Wirecast, and more. Real-time score updates, no installs required.",
  keywords: [
    "live scoreboard",
    "scoreboard overlay",
    "OBS overlay",
    "streaming overlay",
    "esports scoreboard",
    "gaming scoreboard",
    "real-time scoreboard",
    "scoreboard tools",
  ],
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
    apple: faviconUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Scoreboardtools",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
