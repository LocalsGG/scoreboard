import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoreboard",
  description: "Simple Supabase-powered scoreboards and dashboards.",
  icons: {
    icon: "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images/favicon.ico",
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
