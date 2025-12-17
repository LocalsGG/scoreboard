import { Metadata } from "next";
import { PricingPageClient } from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing | Scoreboard.to",
  description: "Choose the plan that fits your needs • 30-day money-back guarantee",
};

export default function PricingPage() {
  return <PricingPageClient />;
}


