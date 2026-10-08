import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://elias-vent-next.startfrom.co';

/** Hand-written: the Next counterpart of the Astro source's src/pages/robots.txt.ts. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: new URL('/sitemap.xml', SITE).href };
}
