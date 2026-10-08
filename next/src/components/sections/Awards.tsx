// GENERATED from src/components/sections/Awards.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { site } from '@/lib/site';
import ScrollWords from '@/components/ScrollWords';

export default function Awards() {
  return (
    <>
      <section className="awards container" data-awards="">
        <div className="awards-card">
          <ScrollWords as="h2" className="h2 balance" text="Awards" />
          <div className="awards-rows">
            {site.awards.map((r, i) => (
              <>
                {i > 0 && <div className="divider" aria-hidden="true"></div>}
                <div className="award-row" data-row={i}>
                  <p className="body award-year">{r.year}</p>
                  <div className="award-right">
                    <h4 className="h4 balance">{r.project}</h4>
                    <p className="body muted">{r.award}</p>
                  </div>
                  <div className="award-preview"><img src={r.cover} alt={r.alt} loading="lazy" /></div>
                </div>
              </>
            ))}
          </div>
        </div>
        <div className="award-cursor" aria-hidden="true" data-cursor="">
          <div className="award-cursor-inner">
            {site.awards.map((r) => <img src={r.cover} alt="" loading="lazy" />)}
          </div>
        </div>
      </section>
    </>
  );
}
