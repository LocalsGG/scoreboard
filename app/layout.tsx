import type { Metadata } from "next";
import { getSupabaseStorageUrl } from "@/lib/assets";
import "./globals.css";

const faviconUrl = `${getSupabaseStorageUrl()}/favicon.ico`;

export const metadata: Metadata = {
  title: "Scoreboard",
  description: "Simple scoreboards and dashboards.",
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
    apple: faviconUrl,
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
