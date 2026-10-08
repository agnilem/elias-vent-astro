// GENERATED from src/components/sections/Services.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';
import { site } from '@/lib/site';

export default function Services() {
  const services = site.services;
  const n = services.length;
  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <>
      <section className="services container">
        <div id="servicesScroll" className="services-scroll" data-services="" data-captions={JSON.stringify(services.map((s) => s.captions))}>
          <div className="services-switcher">
            <div className="services-top">
              <p className="body" style={sx("color: var(--grey)")}>SERVICES</p>
              <p className="caption"><span data-counter="">01</span> / {pad(n)}</p>
            </div>
            <div className="services-middle">
              <div className="services-names">
                {services.map((s, i) => (
                  <h2 className="h2 balance services-name" style={sx(`color: ${i === 0 ? "var(--white)" : "var(--white-60)"}`)} data-name={i}>{s.name}</h2>
                ))}
              </div>
              <div className="services-detail">
                <div className="services-image">
                  {services.map((s, i) => <img className={i === 0 ? "is-on" : undefined} src={s.image} alt={s.alt} loading="lazy" />)}
                </div>
                <div className="services-captions" data-caps="">
                  {services[0].captions.map((c) => <p className="body">{c}</p>)}
                </div>
              </div>
            </div>
            <div className="services-progress">
              <div className="services-fill" style={sx(`width: ${(1 / n) * 100}%`)} data-fill=""></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
