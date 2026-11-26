import { parseInline, parseMarkdown } from '../../src/legal/markdown';

describe('legal markdown', () => {
  it('parses headings, paragraphs, lists and tables', () => {
    const blocks = parseMarkdown(
      '# Title\n\nIntro **bold** [link](x.md).\n\n## Part\n\n- one\n| A | B |\n| --- | --- |\n| c | d |\n',
    );
    expect(blocks.map((b) => b.kind)).toEqual(['h1', 'p', 'h2', 'li', 'row', 'row']);
    expect(parseInline('Intro **bold** [link](x.md).')).toEqual([
      { text: 'Intro ' },
      { text: 'bold', bold: true },
      { text: ' link.' },
    ]);
  });
});
