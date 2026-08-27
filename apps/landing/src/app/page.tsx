import { Features } from '@/components/Features';
import { FinalCta } from '@/components/FinalCta';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Moments } from '@/components/Moments';
import { Nav } from '@/components/Nav';
import { Pricing } from '@/components/Pricing';
import { Showcase } from '@/components/Showcase';
import { Testimonials } from '@/components/Testimonials';

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Moments />
        <Showcase />
        <Pricing />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
