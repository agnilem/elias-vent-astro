// GENERATED from src/pages/projects/[slug].astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import Base from '@/layouts/Base';
import Topbar from '@/components/Topbar';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';
import Icon from '@/components/Icon';
import { getProjects, site } from '@/lib/site';

async function getStaticPaths() {
  const projects = await getProjects();
  return projects.map((project, i) => ({
    params: { slug: project.id },
    props: { project, next: projects[i + 1] ?? null },
  }));
}

export async function generateStaticParams() {
  return (await getStaticPaths()).map((p) => p.params);
}


export default async function Slug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { project, next } = ((await getStaticPaths()).find((p) => p.params.slug === slug)!.props) as any;
  const p = project.data;
  const hasBody = Boolean(project.body?.trim());

  return (
    <>
      <Base route={`/projects/${slug}`} title={`${p.title} | ${site.name}`} description={p.overview}>
        <Topbar path={`/projects/${project.id}`} />
        <main>
          <section className="project-hero">
            <div className="project-head">
              <p className="body">{p.category}</p>
              <h1 className="h1">{p.title}</h1>
              <div className="project-meta">
                <div className="project-meta-col"><p className="body muted">Role</p><p className="body">{p.role}</p></div>
                <div className="project-meta-col"><p className="body muted">Timeline</p><p className="body">{p.timeline}</p></div>
                <div className="project-meta-col"><p className="body muted">Completed</p><p className="body">{p.year}</p></div>
              </div>
            </div>
            <div className="project-cover"><img src={p.cover} alt={p.coverAlt} /></div>
            <div className="project-content">
              <div className="project-col">
                <h2 className="body muted">Overview</h2>
                <p className="body">{p.overview}</p>
                {hasBody && <div className="project-md" dangerouslySetInnerHTML={{ __html: project.rendered?.html }} />}
              </div>
              <div className="project-col">
                <h2 className="body muted">The challenge</h2>
                <p className="body">{p.challenge}</p>
              </div>
            </div>
          </section>
          <div className="project-showcase-wrap">
            <div className="project-showcase"><img src={p.showcase} alt={p.showcaseAlt} loading="lazy" /></div>
          </div>
          {next && (
            <section className="next-project">
              <a className="next-link" href={`/projects/${next.id}`} aria-label={`Next project: ${next.data.title}`}>
                <span className="next-text">
                  <span className="body">{next.data.category}</span>
                  <span className="h2">{next.data.title}</span>
                </span>
                <span className="round-btn" aria-hidden="true"><Icon name="arrow-up-right" size={24} /></span>
              </a>
            </section>
          )}
          <Contact />
        </main>
        <Footer />
      </Base>
    </>
  );
}
