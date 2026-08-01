import { Header } from "@/components/Header";
import { Component as HeroSection } from "@/components/ui/hero-section";
import StatsStrip from "@/components/StatsStrip";
import HowItWorks from "@/components/HowItWorks";
//import Features from "@/components/Features";
// import DashboardPreview from "@/components/DashboardPreview";
// import WhyAI from "@/components/WhyAI";
import CTAFooter from "@/components/CTAFooter";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <HowItWorks />
        <StatsStrip />
        {/* <Features /> */}
        {/* <DashboardPreview /> */}
        {/* <WhyAI /> */}
        <CTAFooter />
      </main>
    </>
  );
}
