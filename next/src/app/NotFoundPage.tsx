// GENERATED from src/pages/404.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import Base from '@/layouts/Base';
import Topbar from '@/components/Topbar';
import Footer from '@/components/sections/Footer';
import ScrollRing from '@/components/ScrollRing';
import Icon from '@/components/Icon';
import { site } from '@/lib/site';

export default function NotFoundPage() {
  return (
    <>
      <Base route="/404" title={`Page not found | ${site.name}`}>
        <Topbar path="/404" />
        <main>
          <section className="nf-hero">
            <ScrollRing images={site.ring} radius={360} scrollSpeed={0.02} autoSpin={2} />
            <div className="nf-content">
              <h1 className="h1">Page not found</h1>
              <p className="body muted balance nf-text">The page you’re looking for doesn’t exist or may have moved. Let’s get you back on track.</p>
              <a className="btn" href="/"><span className="body-sb">Back to home</span><Icon name="arrow-up-right" size={20} /></a>
            </div>
          </section>
        </main>
        <Footer />
      </Base>
    </>
  );
}
