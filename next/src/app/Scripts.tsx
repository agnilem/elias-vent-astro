'use client';

import { useEffect } from 'react';

/**
 * Mounts the site's behaviour: src/scripts/entry.ts, the same file the Astro
 * build loads from Base.astro. Each module reads the markup React rendered
 * and enhances it, so every page is complete before any of this runs.
 */
export default function Scripts() {
  useEffect(() => {
    import('@/scripts/entry');
  }, []);
  return null;
}
