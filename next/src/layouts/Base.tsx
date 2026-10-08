import { site } from '@/lib/site';
import StoreCard from '@/components/StoreCard';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Hand-written counterpart of the Astro source's src/layouts/Base.astro: same
 * props, same head tags, same body. React hoists the head tags into <head>,
 * so each page sets its own title, description and canonical exactly as Astro
 * does. Next adds the charset and viewport meta itself; fonts, global styles
 * and the behaviour scripts are loaded once in src/app/layout.tsx.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://elias-vent-next.startfrom.co';

interface Props {
  /** The page path without a trailing slash ("/", "/404", "/projects/<slug>"). The generator passes it. */
  route: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const defaultTitle = `${site.name} | ${site.role}`;

export default function Base({
  route,
  title = defaultTitle,
  description = 'Product & motion designer with a decade of turning complex products into simple, living experiences. Selected work, services and awards.',
  children,
}: Props) {
  // URLs end in a slash, like the Astro build (trailingSlash in next.config.ts).
  const canonical = new URL(route === '/' ? '/' : `${route}/`, SITE).href;
  const ogImage = new URL('/assets/og.jpg', SITE).href;
  const analytics = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'true';
  const storeBadge = process.env.NEXT_PUBLIC_STORE_BADGE === 'true';
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <meta name="theme-color" content="#121212" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {children}
      {storeBadge && <StoreCard />}
      {analytics && <Analytics />}
      {analytics && <SpeedInsights />}
      <GoogleAnalytics />
    </>
  );
}
