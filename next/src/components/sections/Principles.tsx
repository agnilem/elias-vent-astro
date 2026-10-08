// GENERATED from src/components/sections/Principles.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { site } from '@/lib/site';
import ScrollWords from '@/components/ScrollWords';

export default function Principles() {
  const icons: Record<string, string> = {
    target: '<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />',
    sparkles:
      '<path d="M9.94 14.06A2 2 0 0 0 8.5 12.62L2.37 11.04a.5.5 0 0 1 0-.97L8.5 8.5a2 2 0 0 0 1.44-1.44l1.58-6.13a.5.5 0 0 1 .96 0L14.06 7.06A2 2 0 0 0 15.5 8.5l6.13 1.58a.5.5 0 0 1 0 .96L15.5 12.62a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />',
    accessibility:
      '<circle cx="16" cy="4" r="1" /><path d="m18 19 1-7-5.87.94" /><path d="m5 8 3-3 5.5 3-2.21 3.1" /><path d="M4.24 14.48a5 5 0 0 0 6.88 6.05" /><path d="M13.76 17.52a5 5 0 0 0-3.88-6.9" />',
    smile: '<circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" />',
    compass: '<circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />',
  };

  return (
    <>
      <section className="principles container">
        <div className="principles-header">
          <ScrollWords as="h2" className="h2 balance principles-heading" text={`Here are ${site.principles.length} principles you can always expect from me`} />
        </div>
        <div className="principles-cards">
          {site.principles.map((c) => (
            <div className="pcard" data-pcard="">
              <div className="pcard-inner">
                <div className="pcard-face pcard-front">
                  <h3>{c.title}</h3>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icons[c.icon] ?? icons.target }} />
                </div>
                <div className="pcard-face pcard-back">
                  <img src={c.image} alt={c.alt} loading="lazy" />
                  <p>{c.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
