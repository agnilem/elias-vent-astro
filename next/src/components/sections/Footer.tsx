// GENERATED from src/components/sections/Footer.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';
import { site } from '@/lib/site';

export default function Footer() {
  const FADE =
    "linear-gradient(180deg, #121212 0%, #121212 14%, rgba(18,18,18,0.97) 22%, rgba(18,18,18,0.9) 30%, rgba(18,18,18,0.79) 38%, rgba(18,18,18,0.66) 46%, rgba(18,18,18,0.52) 54%, rgba(18,18,18,0.38) 62%, rgba(18,18,18,0.26) 70%, rgba(18,18,18,0.16) 78%, rgba(18,18,18,0.08) 86%, rgba(18,18,18,0.03) 93%, rgba(18,18,18,0) 100%)";

  return (
    <>
      <footer className="footer">
        <div className="footer-shader" aria-hidden="true"><canvas data-shader=""></canvas></div>
        <div className="footer-fade" aria-hidden="true" style={sx(`background: ${FADE}`)}></div>
        <div className="footer-top container">
          <div className="footer-email">
            <a className="body" href={`mailto:${site.email}`}>{site.email}</a>
            <div className="footer-available">
              <span className="footer-dot" aria-hidden="true"></span>
              <p className="body">Available for work</p>
            </div>
          </div>
          <div className="footer-col footer-social">
            {site.socials.map((s) => <a className="body" href={s.href} target="_blank" rel="noreferrer">{s.label}</a>)}
          </div>
          <nav className="footer-col footer-nav" aria-label="Footer">
            {site.footerNav.map((l) => <a className="body" href={l.href}>{l.label}</a>)}
          </nav>
        </div>
        <div className="footer-wordmark container" style={sx("font-size: 160px")} data-fit="">
          <span aria-hidden="true" data-probe="" style={sx("position: absolute; visibility: hidden; white-space: nowrap; font-size: 100px; font-weight: 700; letter-spacing: 0")}>{site.name}</span>
          <p style={sx("font-weight: 700; line-height: 1em")}>{site.name}</p>
        </div>
        <div className="footer-bottom container">
          <p className="caption"><span className="muted">© {site.year} {site.name}. All rights reserved.</span></p>
        </div>
      </footer>
    </>
  );
}
