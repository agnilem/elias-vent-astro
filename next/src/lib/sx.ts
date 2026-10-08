import type { CSSProperties } from 'react';

/**
 * Astro writes inline styles as CSS text; React wants an object. The markup
 * keeps the CSS text, identical in both builds, and this converts it at render.
 * Objects pass through. Custom properties are kept as they are.
 */
export function sx(css: string | Record<string, unknown> | null | undefined): CSSProperties | undefined {
  if (!css) return undefined;
  if (typeof css !== 'string') return css as CSSProperties;
  const style: Record<string, string> = {};
  for (const part of css.split(/;(?![^(]*\))/)) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const prop = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (!prop || !value) continue;
    style[prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  return style as CSSProperties;
}
