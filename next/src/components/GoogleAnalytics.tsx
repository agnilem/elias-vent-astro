/**
 * Google Analytics for the live demo only. Renders nothing unless
 * NEXT_PUBLIC_GA_ID is set, which only the demo's Vercel project does, so your
 * copy ships without it. (Hand-written counterpart of GoogleAnalytics.astro.)
 */
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;
  // Same loader as GoogleAnalytics.astro: fetch the tag after the page has loaded, or on the first interaction.
  const code = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config",${JSON.stringify(id)});(function(){var d=false,ev=["pointerdown","keydown","scroll","touchstart"];function l(){if(d)return;d=true;ev.forEach(function(e){removeEventListener(e,l)});var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+${JSON.stringify(id)};document.head.appendChild(s)}ev.forEach(function(e){addEventListener(e,l,{passive:true,once:true})});addEventListener("load",function(){setTimeout(l,3500)})})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
