import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { markedSmartypants } from 'marked-smartypants';
import { gfmHeadingId } from 'marked-gfm-heading-id';

/**
 * Hand-written. The Next counterpart of getProjects() in the Astro source's
 * src/lib/site.ts, which reads the "projects" content collection. Reads the
 * same Markdown files (src/content/projects/*.md) and returns the same shape
 * as Astro's collection entries: { id, data, body, rendered: { html } }.
 * Markdown is GitHub-flavoured with smart quotes and heading ids, like Astro's.
 */
export type ProjectData = {
  title: string;
  category: string;
  order: number;
  role: string;
  timeline: string;
  year: string;
  overview: string;
  challenge: string;
  cover: string;
  coverAlt: string;
  showcase: string;
  showcaseAlt: string;
  heroImage: string;
  heroAlt: string;
};
export interface Project { id: string; data: ProjectData; body: string; rendered: { html: string } }

const DIR = join(process.cwd(), 'src', 'content', 'projects');
const markdown = new Marked(markedSmartypants(), gfmHeadingId());

/** Projects in display order, used by the carousel and the case study pages. */
export async function getProjects(): Promise<Project[]> {
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(readFileSync(join(DIR, f), 'utf8'));
      const body = content.trim();
      return { id: f.replace(/\.md$/, ''), data: data as ProjectData, body, rendered: { html: body ? (markdown.parse(body) as string) : '' } };
    })
    .sort((a, b) => a.data.order - b.data.order);
}
