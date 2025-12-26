"use client";

import { useState } from "react";
import { HiCheckCircle, HiXMark } from "react-icons/hi2";

type BillingPeriod = "annual" | "monthly" | "lifetime";

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  subtitle: string;
  description: string;
  cta: string;
  ctaLink: string;
  featured: boolean;
  features: Array<{ text: string; included: boolean }>;
}

const getPricingPlans = (billingPeriod: BillingPeriod = "monthly"): PricingPlan[] => {
  const isAnnual = billingPeriod === "annual";
  const isLifetime = billingPeriod === "lifetime";

  if (isLifetime) {
    return [
      {
        name: "Base",
        price: "Free",
        subtitle: "Always free",
        description: "",
        cta: "Get Started",
        ctaLink: "/signup",
        featured: false,
        features: [
          { text: "Create up to 1 board", included: true },
          { text: "No ads, ever - clean viewing experience", included: true },
          { text: "Invite team members to collaborate", included: true },
          { text: "Match your brand with custom colors", included: false },
          { text: "Add team and sponsor logos", included: false },
        ],
      },
      {
        name: "Pro",
        price: "$100",
        subtitle: "one-time • Pro tier for life",
        description: "Pro tier for life • All future updates included",
        cta: "Claim Lifetime Deal",
        ctaLink: "/signup?plan=lifetime",
        featured: true,
        features: [
          { text: "Create up to 200 scoreboards", included: true },
          { text: "No ads, ever - clean viewing experience", included: true },
          { text: "Match your brand with custom colors", included: true },
          { text: "Add team and sponsor logos", included: true },
          { text: "Invite team members to collaborate", included: true },
        ],
      },
    ];
  }

  return [
    {
      name: "Base",
      price: "Free",
      subtitle: "Always free",
      description: "",
      cta: "Get Started",
      ctaLink: "/signup",
      featured: false,
      features: [
        { text: "Create up to 1 board", included: true },
        { text: "No ads, ever - clean viewing experience", included: true },
        { text: "Invite team members to collaborate", included: true },
        { text: "Match your brand with custom colors", included: false },
        { text: "Add team and sponsor logos", included: false },
      ],
    },
    {
      name: "Standard",
      price: isAnnual ? "$10" : "$20",
      period: "/ month",
      subtitle: isAnnual ? "Billed annually • Save 50%" : "Billed monthly, cancel anytime",
      description: "Everything in Base, and",
      cta: "Get Started",
      ctaLink: "/signup?plan=standard",
      featured: false,
      features: [
        { text: "Create up to 20 scoreboards", included: true },
        { text: "No ads, ever - clean viewing experience", included: true },
        { text: "Add team and sponsor logos", included: true },
        { text: "Invite team members to collaborate", included: true },
        { text: "Match your brand with custom colors", included: false },
      ],
    },
    {
      name: "Pro",
      price: isAnnual ? "$20" : "$40",
      period: "/ month",
      subtitle: isAnnual ? "Billed annually • Save 50%" : "Billed monthly, cancel anytime",
      description: "Everything in Standard, and",
      cta: "Get Started",
      ctaLink: "/signup?plan=pro",
      featured: true,
      features: [
        { text: "Create up to 200 scoreboards", included: true },
        { text: "No ads, ever - clean viewing experience", included: true },
        { text: "Add team and sponsor logos", included: true },
        { text: "Invite team members to collaborate", included: true },
        { text: "Match your brand with custom colors", included: true },
      ],
    },
    {
      name: "Enterprise",
      price: "Let's talk",
      subtitle: "Custom solutions for your team",
      description: "",
      cta: "Contact Us",
      ctaLink: "/contact",
      featured: false,
      features: [
        { text: "Unlimited scoreboards", included: true },
        { text: "Everything in Pro", included: true },
        { text: "Custom integrations", included: true },
        { text: "Dedicated support", included: true },
        { text: "SLA guarantees", included: true },
      ],
    },
  ];
};

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const plans = getPricingPlans(billingPeriod);

  return (
    <section id="pricing" className="w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black mb-8">
            Pricing
          </h2>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                billingPeriod === "annual"
                  ? "bg-black text-white shadow-lg"
                  : "bg-white text-black border-2 border-black/10 hover:border-black/20"
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                billingPeriod === "monthly"
                  ? "bg-black text-white shadow-lg"
                  : "bg-white text-black border-2 border-black/10 hover:border-black/20"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("lifetime")}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                billingPeriod === "lifetime"
                  ? "bg-orange-500 text-white border-2 border-orange-600 shadow-lg"
                  : "bg-white text-black border-2 border-black/10 hover:border-black/20"
              }`}
            >
              Lifetime
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border-2 p-6 sm:p-8 ${
                plan.featured
                  ? "bg-black text-white border-black shadow-2xl md:scale-105 z-10"
                  : "bg-white text-black border-black/10"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-orange-500 text-white text-xs font-black rounded-full uppercase tracking-wide">
                  POPULAR
                </div>
              )}
              <div className="flex-1">
                <h3 className={`text-2xl sm:text-3xl font-black mb-2 ${plan.featured ? "text-white" : "text-black"}`}>
                  {plan.name}
                </h3>
                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl sm:text-5xl font-black ${plan.featured ? "text-white" : "text-black"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-lg ${plan.featured ? "text-zinc-300" : "text-zinc-600"}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-2 ${plan.featured ? "text-zinc-300" : "text-zinc-600"}`}>
                    {plan.subtitle}
                  </p>
                </div>
                {plan.description && (
                  <p className={`text-sm mb-4 ${plan.featured ? "text-zinc-300" : "text-zinc-600"}`}>
                    {plan.description}
                  </p>
                )}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <HiCheckCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            plan.featured ? "text-green-400" : "text-green-600"
                          }`}
                        />
                      ) : (
                        <HiXMark
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            plan.featured ? "text-red-400" : "text-red-500"
                          }`}
                        />
                      )}
                      <span className={`text-sm ${plan.featured ? "text-zinc-200" : "text-zinc-700"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={plan.ctaLink}
                className={`w-full py-3 rounded-lg font-bold text-center text-sm transition-all duration-200 ${
                  plan.featured
                    ? "bg-white text-black hover:bg-zinc-100 shadow-lg"
                    : plan.name === "Enterprise"
                    ? "bg-white text-black border-2 border-black hover:bg-zinc-50"
                    : "bg-black text-white hover:bg-zinc-800 shadow-md hover:shadow-lg"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
