import '@fontsource/sora/400.css';
import '@fontsource/sora/500.css';
import '@fontsource/sora/600.css';
import '@fontsource/sora/700.css';
import '@/styles/site.css';
import Scripts from './Scripts';

/**
 * Document shell only. Head tags come from src/layouts/Base.tsx, which every
 * page renders, the way every Astro page renders Base.astro. Fonts and styles
 * load in the same order as in Base.astro.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
