import { Metadata } from "next";
import { PricingPageClient } from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the plan that fits your needs. Free plan available with up to 1 scoreboard. Upgrade to Standard or Pro for more features. 30-day money-back guarantee.",
  keywords: [
    "scoreboard pricing",
    "scoreboard plans",
    "free scoreboard",
    "scoreboard subscription",
    "esports scoreboard pricing",
  ],
  openGraph: {
    title: "Pricing | Scoreboardtools",
    description: "Choose the plan that fits your needs. Free plan available with up to 1 scoreboard. Upgrade to Standard or Pro for more features.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pricing | Scoreboardtools",
    description: "Choose the plan that fits your needs. Free plan available with up to 1 scoreboard.",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}





