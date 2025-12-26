import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Scoreboardtools - Live Scoreboard Overlays for Streaming",
    template: "%s | Scoreboardtools",
  },
  description: "Create live scoreboard overlays for esports streaming. Works with OBS, Streamlabs, vMix, Wirecast, and more. Real-time score updates, no installs required.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  }>) {
  return <>{children}</>;
}
