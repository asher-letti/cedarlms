import Hero from "@/components/landing/Hero";
import StatsBanner from "@/components/landing/StatsBanner";
import Features from "@/components/landing/Features";
import Showcase from "@/components/landing/Showcase";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import FinalCTA from "@/components/landing/FinalCTA";
import MobileStickyCTA from "@/components/landing/MobileStickyCTA";

/**
 * Landing page — sections live in `src/components/landing/*`.
 * `pb-24 lg:pb-0` reserves room at the bottom on mobile so the sticky
 * CTA never covers footer content.
 */
export default function Home() {
  return (
    <div className="-mx-6 -my-12 pb-24 lg:pb-0">
      <Hero />
      <StatsBanner />
      <Features />
      <Showcase />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
      <MobileStickyCTA />
    </div>
  );
}
