// GENERATED from src/components/sections/Ticker.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';
import { site } from '@/lib/site';

export default function Ticker() {
  return (
    <>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track" style={sx("animation-duration: 48s")} data-ticker="">
          <span className="ticker-text">{site.ticker}</span>
          <span className="ticker-text">{site.ticker}</span>
        </div>
      </div>
    </>
  );
}
