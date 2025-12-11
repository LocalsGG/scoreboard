import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoreboard",
  description: "Simple Supabase-powered scoreboards and dashboards.",
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
