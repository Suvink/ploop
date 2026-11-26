/** Minimal Markdown → blocks parser for the bundled legal documents (headings, text, lists, tables). */
export type Inline = { text: string; bold?: boolean };
export type Block =
  | { kind: 'h1' | 'h2'; text: string }
  | { kind: 'p'; parts: Inline[] }
  | { kind: 'li'; parts: Inline[] }
  | { kind: 'row'; cells: Inline[][] };

/** "**bold** and [link](url)" → inline parts (links keep their text only). */
export function parseInline(s: string): Inline[] {
  const plain = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return plain
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((t) => (t.startsWith('**') ? { text: t.slice(2, -2), bold: true } : { text: t }));
}

export function parseMarkdown(md: string): Block[] {
  const out: Block[] = [];
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) out.push({ kind: 'h2', text: line.slice(3) });
    else if (line.startsWith('# ')) out.push({ kind: 'h1', text: line.slice(2) });
    else if (line.startsWith('- ')) out.push({ kind: 'li', parts: parseInline(line.slice(2)) });
    else if (line.startsWith('|')) {
      if (/^\|[\s|:-]+\|$/.test(line)) continue; // separator row
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => parseInline(c.trim()));
      out.push({ kind: 'row', cells });
    } else out.push({ kind: 'p', parts: parseInline(line) });
  }
  return out;
}
