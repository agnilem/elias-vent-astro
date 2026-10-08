/**
 * Google Analytics for the live demo only. Renders nothing unless
 * NEXT_PUBLIC_GA_ID is set, and that is set only in the demo's Vercel project,
 * so your copy ships without it. (Hand-written counterpart of GoogleAnalytics.astro.)
 */
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config",${JSON.stringify(id)});`,
        }}
      />
    </>
  );
}
