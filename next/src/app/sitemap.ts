import type { MetadataRoute } from 'next';
import { getProjects } from '@/lib/site';

export const dynamic = 'force-static';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://elias-vent-next.startfrom.co';

/** Hand-written: every page except the 404, like @astrojs/sitemap in the Astro build. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = (await getProjects()).map((p) => `/projects/${p.id}/`);
  return ['/', ...projects].map((p) => ({ url: new URL(p, SITE).href }));
}
