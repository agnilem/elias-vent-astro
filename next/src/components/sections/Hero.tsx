// GENERATED from src/components/sections/Hero.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';
import { getProjects, site } from '@/lib/site';
import Icon from '@/components/Icon';

export default async function Hero() {
  const projects = await getProjects();
  const slides = projects.map((p) => ({
    src: p.data.heroImage,
    alt: p.data.heroAlt,
    category: p.data.category,
    title: p.data.title,
    link: `/projects/${p.id}`,
  }));
  const n = slides.length;

  return (
    <>
      <section id="hero" className="hero container">
        <div className="hero-stage">
          <div style={sx("width: 100%; position: relative; display: flex; flex-direction: column; align-items: center")}>
            <div className="pc-root" style={sx(`--n: ${n}`)} data-carousel="" data-slides={JSON.stringify(slides.map((s) => s.src))}>
              <div className="pc-sticky">
                <canvas className="pc-canvas"></canvas>
                <div className="pc-overlays">
                  {slides.map((s, i) => (
                    <div className={"pc-center pc-overlay" + (i === 0 ? " pc-ref-active" : "")} style={sx(`--i: ${i}`)} data-overlay="">
                      <a className="pc-ref-link" href={s.link} aria-label={`Open ${s.title}`}>
                        <span className="pc-ref-ltr pc-cat">{s.category}</span>
                        <h2 className="pc-title">
                          {s.title.split("").map((ch, li) => (
                            <span className="pc-ref-ltr" style={sx(`transition-delay: ${(0.12 + li * 0.03).toFixed(2)}s`)}>{ch}</span>
                          ))}
                        </h2>
                        <span className="pc-ref-btn" aria-hidden="true"><Icon name="carousel-arrow" size={22} /></span>
                      </a>
                    </div>
                  ))}
                </div>
                {n > 1 && (
                  <div className="pc-bar" data-bar="">
                    {slides.map((s, i) => (
                      <button type="button" className="pc-nav-btn" aria-label={`Go to ${s.title}`} aria-current={i === 0 ? "true" : undefined} data-goto={i}>
                        <span className={"pc-nav-bar" + (i === 0 ? " pc-nav-active" : "")}></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="pc-fallback">
                {slides.map((s) => (
                  <section className="pc-fb-slide pc-ref-active">
                    <div className="pc-fb-media"><img src={s.src} alt={s.alt} loading="lazy" /></div>
                    <div className="pc-center">
                      <a className="pc-ref-link" href={s.link} aria-label={`Open ${s.title}`}>
                        <span className="pc-ref-ltr pc-cat">{s.category}</span>
                        <h2 className="pc-title">{s.title.split("").map((ch) => <span className="pc-ref-ltr">{ch}</span>)}</h2>
                        <span className="pc-ref-btn" aria-hidden="true"><Icon name="carousel-arrow" size={22} /></span>
                      </a>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <h1 className="body balance hero-heading">{site.tagline}</h1>
        </div>
      </section>
    </>
  );
}
