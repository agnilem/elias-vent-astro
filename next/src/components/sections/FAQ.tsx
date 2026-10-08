// GENERATED from src/components/sections/FAQ.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { site } from '@/lib/site';
import ScrollWords from '@/components/ScrollWords';
import Icon from '@/components/Icon';

export default function FAQ() {
  return (
    <>
      <section className="faq container">
        <div className="faq-card">
          <div className="faq-left">
            <ScrollWords as="h2" className="h2 balance" text="Frequently asked questions" />
          </div>
          <div className="faq-rows" data-faq="">
            {site.faq.map((it, i) => (
              <>
                {i > 0 && <div className="divider" aria-hidden="true"></div>}
                <button type="button" className="faq-item" aria-expanded="false">
                  <div className="faq-head">
                    <h4 className="h4 balance faq-question">{it.q}</h4>
                    <span className="faq-toggle"><Icon name="plus" size={22} stroke={1.5} /></span>
                  </div>
                  <div className="faq-answer-wrap" aria-hidden="true">
                    <p className="body balance faq-answer">{it.a}</p>
                  </div>
                </button>
              </>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
