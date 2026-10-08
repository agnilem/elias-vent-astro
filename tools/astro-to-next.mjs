// Generate the Next.js build (next/) from the Astro source (src/).
//
// Astro is the source of truth. This script parses every .astro file with
// Astro's own compiler (an ESTree + JSX AST), rewrites only what React spells
// differently, and writes the matching .tsx. Markup, class names, data hooks
// and copy stay byte-identical, so the two builds cannot drift in layout.
// Whitespace needs no work: Astro 7 compresses markup with JSX's own rules
// (compressHTML: "jsx"), so both builds keep and drop the same spaces.
//
//
//   class / class:list        -> className / className={cx(...)}
//   set:html={x}              -> dangerouslySetInnerHTML={{ __html: x }}
//   style="css" | style={x}   -> style={sx(...)}  (CSS text parsed at render)
//   for, tabindex, srcset ... -> htmlFor, tabIndex, srcSet ...
//   data-x (no value)         -> data-x=""  (React would write "true")
//   <slot />                  -> {children}
//   <style>, <!-- -->         -> dropped (styles: tools/collect-css.mjs)
//   const {..} = Astro.props  -> function parameters
//   import.meta.env.PUBLIC_*  -> process.env.NEXT_PUBLIC_*
//   pages/x.astro             -> app/x/page.tsx (getStaticPaths -> generateStaticParams)
//
// Hand-written Next counterparts (not generated): src/layouts/Base.tsx,
// src/components/GoogleAnalytics.tsx, src/lib/projects-loader.ts,
// src/app/layout.tsx, src/app/Scripts.tsx, src/app/sitemap.ts, src/app/robots.ts.
// Everything else is generated. Anything the script does not understand fails
// the run, rather than being passed through silently.
import { parse } from '../node_modules/@astrojs/compiler-rs/dist/index.mjs';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, relative, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const A = join(ROOT, 'src');
const N = join(ROOT, 'next', 'src');
const SITE_DEFAULT = "(process.env.NEXT_PUBLIC_SITE_URL || 'https://elias-vent-next.startfrom.co')";
const HAND = new Set(['layouts/Base.astro', 'components/GoogleAnalytics.astro']);
const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

const walkDir = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walkDir(join(d, f)) : [join(d, f)]));

// ---------------------------------------------------------------- attributes
function pageRoute(rel) {
  const r = rel.replace(/^pages\//, '').replace(/\.astro$/, '').replace(/(^|\/)index$/, '');
  if (r.includes('[')) return '{`/' + r.replace(/\[(\w+)\]/g, '${$1}') + '`}';
  return '"/' + r + '"';
}

const DOM_ATTR = {
  for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength',
  autocomplete: 'autoComplete', autofocus: 'autoFocus', srcset: 'srcSet', fetchpriority: 'fetchPriority',
  crossorigin: 'crossOrigin', enctype: 'encType', novalidate: 'noValidate', inputmode: 'inputMode',
  spellcheck: 'spellCheck', colspan: 'colSpan', rowspan: 'rowSpan', playsinline: 'playsInline', autoplay: 'autoPlay',
  allowfullscreen: 'allowFullScreen', frameborder: 'frameBorder', referrerpolicy: 'referrerPolicy',
  contenteditable: 'contentEditable', accesskey: 'accessKey', datetime: 'dateTime', 'accept-charset': 'acceptCharset',
  'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'xmlns:xlink': 'xmlnsXlink', class: 'className',
};
const camel = (s) => s.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());
function domAttrName(name) {
  if (DOM_ATTR[name]) return DOM_ATTR[name];
  if (name.startsWith('data-') || name.startsWith('aria-')) return name;
  if (name.includes('-') || name.includes(':')) return camel(name); // SVG presentation attributes
  return name;
}

// ---------------------------------------------------------------- imports
function mapImport(spec, fromFile) {
  if (spec.endsWith('.css')) return null;
  if (spec === 'astro:content' || spec.startsWith('@vercel/') || spec.startsWith('@fontsource/')) return null;
  if (!spec.startsWith('.')) return spec;
  const abs = resolve(dirname(fromFile), spec);
  const rel = relative(A, abs).replace(/\\/g, '/').replace(/\.astro$/, '').replace(/\.(ts|js|mjs)$/, '');
  return '@/' + rel;
}

// ---------------------------------------------------------------- core
function convert(file) {
  const rel = relative(A, file).replace(/\\/g, '/');
  const src = readFileSync(file, 'utf8');
  const { ast, diagnostics } = parse(src);
  for (const d of diagnostics || []) if (d.severity === 'error' || d.severity === 1) err(rel, 'parse: ' + (d.text || d.message));
  const edits = []; // [start, end, replacement]
  const cut = (s, e, r = '') => edits.push([s, e, r]);
  const isPage = rel.startsWith('pages/');

  const imported = new Set((ast.frontmatter?.program?.body || []).filter((st) => st.type === 'ImportDeclaration').flatMap((st) => st.specifiers.map((sp) => sp.local.name)));

  // ---- body
  const visit = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach((c) => visit(c));
    if (n.type === 'AstroComment') return cut(n.start, n.end);
    if (n.type === 'JSXElement' || n.type === 'JSXFragment') {
      const open = n.openingElement;
      const tag = open ? src.slice(open.name.start, open.name.end) : '';
      if (tag === 'style') return cut(n.start, n.end);
      if (tag === 'script') {
        const type = open.attributes.find((a) => a.name?.name === 'type')?.value?.value;
        if (type !== 'application/ld+json') { err(rel, '<script> in a component; move it to src/scripts/fx and import it from src/scripts/entry.ts'); return; }
      }
      if (open) for (const a of open.attributes) if (a.name?.name === 'slot' && tag !== 'slot') cut(a.start - 1, a.end);
      // Astro's Base reads the path from Astro.url; Next's cannot, so pages pass it.
      if (tag === 'Base' && isPage && !open.attributes.some((a) => a.name?.name === 'route')) {
        cut(open.name.end, open.name.end, ' route=' + pageRoute(rel));
      }
      if (tag === 'slot') {
        const nameAttr = open.attributes.find((a) => a.name?.name === 'name');
        return cut(n.start, n.end, nameAttr ? `{${nameAttr.value.value}}` : '{children}');
      }
      if (tag === 'Fragment') {
        if (open.attributes.length) err(rel, '<Fragment> with attributes');
        cut(open.start, open.end, '<>');
        if (n.closingElement) cut(n.closingElement.start, n.closingElement.end, '</>');
      }
      // A capitalised tag is a component when it is imported; otherwise it is a
      // dynamic DOM tag such as `const { as: Tag } = Astro.props`.
      const isComponent = imported.has(tag.split('.')[0]);
      if (open) for (const a of open.attributes) attr(a, isComponent, n);
      return visit(n.children);
    }
    if (n.type === 'JSXText') {
      const t = src.slice(n.start, n.end);
      if (/[>}]/.test(t)) cut(n.start, n.end, t.replace(/>/g, "{'>'}").replace(/\}/g, "{'}'}"));
      return;
    }
    for (const k of Object.keys(n)) if (k !== 'start' && k !== 'end') visit(n[k]);
  };

  const attr = (a, isComponent, el) => {
    if (a.type === 'JSXSpreadAttribute') return visit(a.argument);
    const name = src.slice(a.name.start, a.name.end);
    const v = a.value;
    const vsrc = v ? src.slice(v.start, v.end) : null;
    const inner = v?.type === 'JSXExpressionContainer' ? src.slice(v.expression.start, v.expression.end) : null;
    if (v?.type === 'JSXExpressionContainer') visit(v.expression);
    if (name === 'class:list') return cut(a.start, a.end, `className={cx(${inner})}`);
    if (name === 'set:html') {
      if (isComponent) err(rel, 'set:html on a component');
      if (el.children?.some((c) => !(c.type === 'JSXText' && !src.slice(c.start, c.end).trim()))) err(rel, 'set:html element has children');
      if (el.children?.length) cut(el.children[0].start, el.children.at(-1).end);
      return cut(a.start, a.end, `dangerouslySetInnerHTML={{ __html: ${inner ?? vsrc} }}`);
    }
    if (name.startsWith('set:') || name.startsWith('is:') || name.startsWith('client:') || name === 'define:vars' || name.startsWith('transition:')) {
      return err(rel, `unsupported directive ${name}`);
    }
    if (name === 'style' && !isComponent) {
      if (v?.type === 'Literal') return cut(a.start, a.end, `style={sx(${vsrc})}`);
      if (inner !== null) return cut(a.start, a.end, `style={sx(${inner})}`);
      if (vsrc?.startsWith('`')) return cut(a.start, a.end, `style={sx(${vsrc})}`);
      return err(rel, 'style attribute without a value');
    }
    // Astro allows attr=`template`; JSX needs braces.
    if (vsrc?.startsWith('`')) cut(v.start, v.end, `{${vsrc}}`);
    const out = isComponent ? (name === 'class' ? 'className' : name) : domAttrName(name);
    // A bare data-* attribute is "" in HTML; React would render "true".
    if (!isComponent && !v && name.startsWith('data-')) return cut(a.start, a.end, `${name}=""`);
    // React types these DOM attributes as numbers.
    if (!isComponent && v?.type === 'Literal' && /^(tabIndex|rows|cols|maxLength|minLength|colSpan|rowSpan|span|start)$/.test(out) && /^-?\d+$/.test(String(v.value))) cut(v.start, v.end, `{${v.value}}`);
    if (out !== name) cut(a.name.start, a.name.end, out);
  };

  visit(ast.body);

  // ---- frontmatter
  const fm = ast.frontmatter;
  const imports = new Set();
  let props = null, propsType = '', staticPaths = null;
  const body = [], types = [];
  if (fm?.program) {
    for (const st of fm.program.body) {
      const text = src.slice(st.start, st.end);
      if (st.type === 'ImportDeclaration') {
        const to = mapImport(st.source.value, file);
        if (to === null) continue;
        imports.add(src.slice(st.start, st.source.start) + `'${to}';`);
        continue;
      }
      if (st.type === 'TSInterfaceDeclaration' && st.id.name === 'Props') { propsType = text.replace(/\bclass(\??):/g, 'className$1:'); continue; }
      if (st.type === 'TSInterfaceDeclaration' || st.type === 'TSTypeAliasDeclaration' || (st.type === 'ExportNamedDeclaration' && /^TS(Interface|TypeAlias)Declaration$/.test(st.declaration?.type))) { types.push(text); continue; }
      if (st.type === 'ExportNamedDeclaration' && st.declaration?.id?.name === 'getStaticPaths') { staticPaths = text.replace(/^export\s+/, ''); continue; }
      if (st.type === 'VariableDeclaration' && st.declarations.length === 1 && /^Astro\.props$/.test(src.slice(st.declarations[0].init?.start, st.declarations[0].init?.end))) {
        props = src.slice(st.declarations[0].id.start, st.declarations[0].id.end).replace(/\bclass\s*:/g, 'className:');
        continue;
      }
      body.push(text);
    }
  }
  const env = (t) => t.replace(/import\.meta\.env\.SITE\b/g, SITE_DEFAULT).replace(/import\.meta\.env\.PUBLIC_/g, 'process.env.NEXT_PUBLIC_');
  let code = env(body.join('\n'));
  if (/\bAstro\./.test(code)) err(rel, 'Astro.* used in frontmatter code');
  if (/\bimport\.meta\b/.test(code)) err(rel, 'import.meta used in frontmatter code');

  // apply body edits
  const off = fm ? fm.end : 0;
  let markup = src.slice(off);
  edits.sort((x, y) => y[0] - x[0] || y[1] - x[1]);
  for (const [s, e, r] of edits) { if (s < off) continue; markup = markup.slice(0, s - off) + r + markup.slice(e - off); }
  markup = markup.replace(/^\s*---\s*/, '').trim();
  if (/\bAstro\./.test(markup)) err(rel, 'Astro.* used in markup');
  if (/\b(set|is|client|class):[a-z]/.test(markup.replace(/https?:\/\/\S+/g, ''))) err(rel, 'Astro directive left in markup');
  markup = markup.replace(/import\.meta\.env\.PUBLIC_/g, 'process.env.NEXT_PUBLIC_');

  const usesChildren = /\{children\}/.test(markup);
  const head = [];
  if (markup.includes('cx(')) head.push("import { cx } from '@/lib/cx';");
  if (markup.includes('sx(')) head.push("import { sx } from '@/lib/sx';");
  head.push(...imports);
  const isAsync = /\bawait\b/.test(code);

  let name = basename(file, '.astro').replace(/(^|[-_\[\]])(\w)/g, (_, __, c) => c.toUpperCase()).replace(/\W/g, '');
  if (/^\d/.test(name)) name = 'Page' + name;
  let sig = props ? props : usesChildren ? '{ children }' : '';
  if (props && usesChildren && !/\bchildren\b/.test(props)) sig = props.replace(/\}\s*$/, ', children }');
  let ann = propsType ? ': Props' : '';
  if (usesChildren) ann = propsType ? ': Props & { children?: React.ReactNode }' : ': { children?: React.ReactNode }';

  let pre = '';
  if (staticPaths) {
    // getStaticPaths returns [{ params: { slug }, props }]. Next asks for the
    // params up front and the page looks its props up again by slug.
    if (props && /\bslug\b/.test(props)) err(rel, 'a prop named slug clashes with the route param');
    pre = `${env(staticPaths)}\n\nexport async function generateStaticParams() {\n  return (await getStaticPaths()).map((p) => p.params);\n}\n`;
    sig = `{ params }: { params: Promise<{ slug: string }> }`;
    ann = '';
    code = `const { slug } = await params;\nconst ${props ?? '_'} = ((await getStaticPaths()).find((p) => p.params.slug === slug)!.props) as any;\n${code}`;
  }
  const fn = `export default ${isAsync || staticPaths ? 'async ' : ''}function ${name}(${sig}${ann}) {\n` +
    (code.trim() ? code.split('\n').map((l) => (l.trim() ? '  ' + l : '')).join('\n') + '\n\n' : '') +
    `  return (\n    <>\n${markup.split('\n').map((l) => (l.trim() ? '      ' + l : '')).join('\n')}\n    </>\n  );\n}\n`;

  const banner = `// GENERATED from src/${rel} by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.\n`;
  const out = [banner + head.join('\n'), types.join('\n'), propsType, pre, fn].filter(Boolean).join('\n\n');

  if (isPage) {
    let route = rel.replace(/^pages\//, '').replace(/\.astro$/, '');
    if (route === '404') return { rel, dest: join(N, 'app', 'NotFoundPage.tsx'), out: out.replace(/export default (async )?function \w+/, 'export default $1function NotFoundPage') };
    route = route === 'index' ? '' : route.replace(/\/index$/, '');
    return { rel, dest: join(N, 'app', route, 'page.tsx'), out };
  }
  return { rel, dest: join(N, rel.replace(/\.astro$/, '.tsx')), out };
}

// ---------------------------------------------------------------- run
// The generated JSX relies on Astro's default whitespace rules (compressHTML: "jsx").
if (/compressHTML\s*:\s*(?!["']jsx["'])/.test(readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8'))) err('astro.config.mjs', 'compressHTML must stay "jsx" (the default) for the Next build to match');
const files = walkDir(A).filter((f) => f.endsWith('.astro') && !HAND.has(relative(A, f).replace(/\\/g, '/')));
// Pages that are not .astro (robots.txt.ts) have hand-written Next routes.
for (const f of walkDir(join(A, 'pages'))) if (!f.endsWith('.astro') && !/robots\.txt\.ts$/.test(f)) err(relative(A, f), 'non-Astro page without a Next counterpart');
for (const d of ['components', 'app']) {
  // Wipe generated output (never the hand-written files).
  const dir = join(N, d);
  if (!existsSync(dir)) continue;
  for (const f of walkDir(dir)) if (readFileSync(f, 'utf8').startsWith('// GENERATED')) rmSync(f);
}
const results = files.map(convert);
for (const { dest, out } of results) { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, out); }

// Content and behaviour are shared verbatim.
const copyTree = (from, to) => {
  for (const f of walkDir(from)) {
    const d = join(to, relative(from, f));
    mkdirSync(dirname(d), { recursive: true });
    copyFileSync(f, d);
  }
};
rmSync(join(N, 'scripts'), { recursive: true, force: true });
copyTree(join(A, 'scripts'), join(N, 'scripts'));
for (const f of walkDir(join(N, 'scripts'))) if (/import\.meta|astro:/.test(readFileSync(f, 'utf8'))) err(relative(N, f), 'Astro-only API in a shared script');
rmSync(join(N, 'content'), { recursive: true, force: true });
copyTree(join(A, 'content'), join(N, 'content'));

// lib/: plain TS helpers, with the collection loader swapped for Next's.
mkdirSync(join(N, 'lib'), { recursive: true });
for (const f of readdirSync(join(A, 'lib'))) {
  let s = readFileSync(join(A, 'lib', f), 'utf8').replace(/import\.meta\.env\.PUBLIC_/g, 'process.env.NEXT_PUBLIC_');
  if (f === 'site.ts') {
    // getProjects() reads Astro's content collection; Next's lives in
    // projects-loader.ts (hand-written, same shape). Everything else is shared.
    const before = s;
    s = s.replace(/^import .*"astro:content";\n/m, '')
      .replace(/(\/\*\*[^*]*\*\/\n)?export async function getProjects\(\)[\s\S]*?\n\}\n/m, '');
    if (s === before || /astro:content|getCollection/.test(s)) err('lib/site.ts', 'could not split out the Astro loader');
    s = s.replace(/^(import data from .*\n)/m, `$1export { getProjects } from "./projects-loader";\n`);
  }
  if (/astro:|\bAstro\./.test(s)) err('lib/' + f, 'Astro-only API');
  writeFileSync(join(N, 'lib', f), `// GENERATED from src/lib/${f}\n` + s);
}

console.log(`${results.length} files -> next/src`);
if (errors.length) { console.error('\nFAILED:\n  ' + errors.join('\n  ')); process.exit(1); }
