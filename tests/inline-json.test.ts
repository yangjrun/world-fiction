import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { inlineJson } from '@/lib/inline-json';

// Two places write JSON into an inline `<script>`: the JSON-LD blocks
// `src/layouts/BaseLayout.astro` renders on every page, and the locale tables the
// apex language-detection script carries. Both use `set:html`, which writes the
// string into the document verbatim, so the serialiser — not the template — is
// the only thing standing between a value and the HTML parser.
//
// The document page feeds those blocks `documentName` and every FAQ question and
// answer straight from spec frontmatter, typed as an unconstrained
// `z.string().min(1)`. No spec carries a `<` today. FAQ prose is also exactly
// what translators are handed next.

const CLOSING_TAG = '</script>';

const source = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

/** The element a template builds around one serialised block. */
const element = (value: unknown): string =>
  `<script type="application/ld+json">${inlineJson(value)}${CLOSING_TAG}`;

describe('inlineJson', () => {
  it('cannot have its script element ended by a value', () => {
    const faqBlock = {
      '@type': 'Question',
      name: 'What size is a US passport photo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '2 x 2 inches.</script><script>fetch("/log?c=" + document.cookie)</script>',
      },
    };

    const html = element(faqBlock);

    // The only script terminator in the element is the one the template wrote,
    // and the only opening tag is the one it opened with. Everything the payload
    // contributed sits between them as data.
    expect(html.indexOf(CLOSING_TAG)).toBe(html.length - CLOSING_TAG.length);
    expect(html.lastIndexOf('<script')).toBe(0);
  });

  it('leaves no < for the parser to act on at all', () => {
    // `</script`, `<!--` and `<script` are the three ways out of script-data
    // state, and each one needs a `<`.
    const escaped = inlineJson({ close: '</script>', comment: '<!--', open: '<script>' });
    expect(escaped).not.toContain('<');
  });

  it('changes the encoding and not the data', () => {
    const value = { text: 'a </script> b <!-- c', markup: ['<em>', '</em>'] };
    expect(JSON.parse(inlineJson(value))).toEqual(value);
  });

  it('escapes the line terminators JSON leaves raw', () => {
    // Legal inside a JSON string, but line breaks to a JavaScript parser, so a
    // consumer reading the block with anything eval-shaped chokes on them.
    const value = { text: 'one\u2028two\u2029three' };
    const escaped = inlineJson(value);

    expect(escaped).not.toContain('\u2028');
    expect(escaped).toContain(String.raw`\u2028`);
    expect(escaped).toContain(String.raw`\u2029`);
    expect(JSON.parse(escaped)).toEqual(value);
  });

  it('serialises an absent block as null rather than throwing mid-build', () => {
    // JSON.stringify(undefined) returns undefined, and `.replace` on that ends a
    // build with a TypeError from inside an attribute.
    expect(inlineJson(undefined)).toBe('null');
    expect(inlineJson(null)).toBe('null');
  });
});

describe('the inline-script sinks route through it', () => {
  // Sending either sink back to `JSON.stringify` is a one-word edit, and the
  // output looks identical for every value in the repository today.
  it('BaseLayout serialises its JSON-LD blocks with inlineJson', () => {
    const layout = source('../src/layouts/BaseLayout.astro');
    expect(layout).toContain('set:html={inlineJson(block)}');
    expect(layout).not.toMatch(/set:html=\{JSON\.stringify/);
  });

  it('the apex redirect shares the helper instead of keeping its own', () => {
    const apex = source('../src/i18n/apex-redirect.ts');
    expect(apex).toContain("import { inlineJson } from '@/lib/inline-json';");
    expect(apex).not.toMatch(/function inlineJson/);
  });
});
