/**
 * Builds the GitHub Pages site in docs/ from the same Markdown the app bundles.
 * Run: npm run site   (then commit docs/*.html)
 *
 *   docs/privacy-policy.md → docs/privacy.html
 *   docs/terms.md          → docs/terms.html
 *   docs/index.html is hand-written; only its shared header/footer come from here.
 */
import fs from 'node:fs';
import path from 'node:path';

const docs = path.resolve(__dirname, '..', 'docs');
const LINKS: Record<string, string> = {
  'privacy-policy.md': 'privacy.html',
  'terms.md': 'terms.html',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s: string): string {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) => {
      const url = LINKS[href] ?? href;
      return `<a href="${url}">${text}</a>`;
    })
    .replace(/\b([\w.+-]+@[\w-]+\.[\w.]+)\b/g, '<a href="mailto:$1">$1</a>');
}

/** Small Markdown → HTML for our two documents: headings, paragraphs, lists, tables. */
export function markdownToHtml(md: string): { title: string; html: string } {
  const lines = md.split('\n');
  let title = '';
  const out: string[] = [];
  let list = false;
  let table: string[][] | null = null;
  const flush = () => {
    if (list) out.push('</ul>');
    list = false;
    if (table) {
      const [head, ...rows] = table;
      out.push(
        '<div class="table-scroll"><table><thead><tr>' +
          head.map((c) => `<th>${inline(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows
            .map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>')
            .join('') +
          '</tbody></table></div>',
      );
      table = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('|')) {
      if (list) flush();
      if (/^\|[\s|:-]+\|$/.test(line)) continue;
      (table ??= []).push(
        line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim()),
      );
      continue;
    }
    if (line.startsWith('- ')) {
      if (table) flush();
      if (!list) out.push('<ul>');
      list = true;
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    flush();
    if (!line) continue;
    if (line.startsWith('# ')) {
      title = line.slice(2);
      out.push(`<h1>${esc(title)}</h1>`);
    } else if (line.startsWith('## ')) out.push(`<h2>${esc(line.slice(3))}</h2>`);
    else if (out.length === 1 && line.startsWith('**'))
      out.push(`<p class="meta">${inline(line)}</p>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return { title, html: out.join('\n') };
}

export const HEAD = (title: string, description: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#14183A" />
    <link rel="icon" type="image/png" href="assets/favicon.png" />
    <link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="assets/site.css" />
  </head>
  <body>
    <header class="wrap top">
      <a class="brand" href="./"><img src="assets/logo.png" alt="" width="40" height="40" />Ploop</a>
      <nav>
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
      </nav>
    </header>
`;

export const FOOT = `    <footer>
      <div class="wrap row">
        <span>© 2026 Suvin Kodituwakku · Every flight as a little story</span>
        <nav>
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms and Conditions</a>
          <a href="mailto:ploop@suvin.me">ploop@suvin.me</a>
          <a href="https://github.com/Suvink/ploop">GitHub</a>
        </nav>
      </div>
    </footer>
  </body>
</html>
`;

function buildDoc(src: string, out: string, description: string) {
  const { title, html } = markdownToHtml(fs.readFileSync(path.join(docs, src), 'utf8'));
  fs.writeFileSync(
    path.join(docs, out),
    HEAD(`${title} · Ploop`, description) + `    <main class="doc">\n${html}\n    </main>\n` + FOOT,
  );
  console.log(`docs/${out}`);
}

if (require.main === module) {
  buildDoc(
    'privacy-policy.md',
    'privacy.html',
    'How Ploop handles your data: it stays on your phone.',
  );
  buildDoc('terms.md', 'terms.html', 'Terms and conditions for using the Ploop app.');
}
