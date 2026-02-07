export type PlanId = "starter" | "pro" | "nexus";
export type Resolution = "ms" | "sec" | "min" | "hour" | "day";

export type Plan = {
  id: PlanId;
  title: string;
  priceMonthlyUsd: number;
  resolution: Resolution;
  maxRequestsPerDay: number;
  tagline: string;
  features: string[];
  cta: string;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    title: "Starter",
    priceMonthlyUsd: 19,
    resolution: "day",
    maxRequestsPerDay: 200,
    tagline: "Daily snapshots for light usage.",
    features: ["Daily resolution", "200 req/day", "Basic dashboard"],
    cta: "Start Starter",
  },
  {
    id: "pro",
    title: "Pro",
    priceMonthlyUsd: 99,
    resolution: "min",
    maxRequestsPerDay: 5000,
    tagline: "Minute-level access.",
    features: ["Minute resolution", "5,000 req/day", "Analytics"],
    cta: "Start Pro",
  },
  {
    id: "nexus",
    title: "Nexus",
    priceMonthlyUsd: 499,
    resolution: "ms",
    maxRequestsPerDay: 200000,
    tagline: "Millisecond-grade enterprise access.",
    features: ["Millisecond resolution", "200k req/day", "SLA"],
    cta: "Contact Sales",
  },
];
