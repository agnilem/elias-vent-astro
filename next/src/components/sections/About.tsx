// GENERATED from src/components/sections/About.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';
import { site } from '@/lib/site';
import ScrollWords from '@/components/ScrollWords';
import ScrollFade from '@/components/ScrollFade';

export default function About() {
  const { about } = site;

  return (
    <>
      <section id="about-alt" className="about">
        <div className="about-stage">
          <div className="about-parallax" data-parallax="">
            <div className="about-media">
              <img src="/assets/portrait.webp" alt={`${site.name}, ${site.role.toLowerCase()}`} loading="lazy" />
            </div>
          </div>
          <div className="about-scrim" aria-hidden="true"></div>
          <div className="about-content">
            <div className="about-statement-row container">
              <div className="about-statement">
                <ScrollWords as="h2" className="h2 balance" style="text-align: end" text={about.statement} />
              </div>
            </div>
            <div className="about-bio-row container">
              <div className="about-bio-col">
                <p className="body muted">ABOUT</p>
                <ScrollFade>
                  <div className="about-paragraphs">
                    <p className="body balance">{about.bio}</p>
                    <p className="body balance">
                      {about.contactLead} <a href={`mailto:${site.email}`} style={sx("color: var(--white)")}>{site.email}</a> {about.contactTail}
                    </p>
                  </div>
                </ScrollFade>
                <p className="body muted">{site.name.toUpperCase()} — {site.year}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
