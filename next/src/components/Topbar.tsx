// GENERATED from src/components/Topbar.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { cx } from '@/lib/cx';
import { sx } from '@/lib/sx';
import { site } from '@/lib/site';
import Icon from '@/components/Icon';

interface Props {
  path: string;
}

export default function Topbar({ path }: Props) {
  const isCurrent = (href: string) => href === path;

  return (
    <>
      <header className="topbar" data-topbar="">
        <div className="topbar-bar container">
          <div className="topbar-logo">
            <a href="/" className="body" style={sx("color: var(--white)")}>{site.name}</a>
            <p className="body muted">{site.role}</p>
          </div>
          <nav className="topbar-links" aria-label="Primary">
            {site.nav.map((l) => <a className={cx(["body-sb", { "is-current": isCurrent(l.href) }])} href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}>{l.label}</a>)}
          </nav>
          <button type="button" className="topbar-menu" aria-label="Open menu" aria-expanded="false" data-menu-btn="">
            <span className="topbar-icon" data-icon-open=""><Icon name="menu" size={24} stroke={1} /></span>
            <span className="topbar-icon" data-icon-close="" style={sx("opacity: 0")}><Icon name="x" size={24} stroke={1} /></span>
          </button>
        </div>
        <nav className="topbar-mobile" aria-label="Mobile" aria-hidden="true" data-mobile-nav="">
          {site.nav.map((l) => <a className={cx(["h3", { "is-current": isCurrent(l.href) }])} href={l.href} tabIndex={-1}>{l.label}</a>)}
        </nav>
      </header>
    </>
  );
}
