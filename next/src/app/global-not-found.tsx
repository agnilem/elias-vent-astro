import '@fontsource/sora/400.css';
import '@fontsource/sora/500.css';
import '@fontsource/sora/600.css';
import '@fontsource/sora/700.css';
import '@/styles/site.css';
import Scripts from './Scripts';
import NotFoundPage from './NotFoundPage';

/**
 * The 404 page (out/404.html). A whole document of its own, like layout.tsx,
 * so its markup and images stay out of every other page's payload (Next
 * would otherwise preload the 404 ring images on every page).
 * NotFoundPage is generated from the Astro source's src/pages/404.astro.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <NotFoundPage />
        <Scripts />
      </body>
    </html>
  );
}
