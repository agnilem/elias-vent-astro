// GENERATED from src/pages/index.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import Base from '@/layouts/Base';
import Topbar from '@/components/Topbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Awards from '@/components/sections/Awards';
import Principles from '@/components/sections/Principles';
import Ticker from '@/components/sections/Ticker';
import Services from '@/components/sections/Services';
import Gallery from '@/components/sections/Gallery';
import FAQ from '@/components/sections/FAQ';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';

export default function Index() {
  return (
    <>
      <Base route="/">
        <Topbar path="/" />
        <main>
          <Hero />
          <About />
          <Awards />
          <Principles />
          <Ticker />
          <Services />
          <Gallery />
          <FAQ />
          <Contact />
        </main>
        <Footer />
      </Base>
    </>
  );
}
