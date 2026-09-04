/**
 * JSON destined for the body of an inline `<script>` element.
 *
 * `JSON.stringify` is a JSON serialiser, not an HTML one: it escapes nothing an
 * HTML parser cares about, `<` and `/` included. Inside a `<script>` the parser
 * scans raw text for `</script`, so a single `</script>` anywhere in a serialised
 * value ends the element early and everything after it is parsed as markup —
 * a `<script>` of the payload author's choosing included. `type` is no shield:
 * the tokenizer treats `application/ld+json` content exactly like executable
 * script content.
 *
 * Escaping `<` closes that off completely, because every exit from script-data
 * state (`</script`, `<!--`, `<script`) has to begin with one. With none left in
 * the output, the only `</script` in the document is the one the template wrote.
 * `\u003c` is a JSON string escape, so what a parser reads back is unchanged:
 * this changes the encoding, never the data.
 *
 * U+2028 and U+2029 go too. JSON permits them raw inside a string, but they are
 * line terminators in JavaScript, so a value carrying one breaks any consumer
 * that reads the block with an eval-shaped parser rather than a JSON one.
 *
 * `&` and `>` are deliberately left alone: neither can begin an escape sequence
 * in script data, and escaping them would only make the emitted JSON-LD harder
 * to read in view-source.
 *
 * Callers serialise content frontmatter and translation bundles — prose that
 * humans, and shortly translators, edit — so this is the only serialiser allowed
 * to write into an inline script. `src/i18n/apex-redirect.ts` and
 * `src/layouts/BaseLayout.astro` both route through here for that reason.
 */
export function inlineJson(value: unknown): string {
  // JSON.stringify returns undefined — not a string — for undefined, and for a
  // bare function or symbol, and `.replace` on that would end a build with a
  // TypeError raised from inside a `set:html` attribute, where the stack says
  // nothing useful about which block was at fault. Its return is typed `string`,
  // so the check has to be a runtime one, and `null` is the substitute because
  // every JSON-LD consumer skips a null block.
  //
  // Not everything unserialisable arrives here as undefined: JSON.stringify
  // *throws* on a BigInt and on a circular structure, and both are left to throw.
  // Neither is a shape content can take — the frontmatter and translation values
  // feeding these blocks are Zod-validated strings, numbers and dates — so both
  // would mean a bug in a caller, and a build that dies naming this file is a
  // better outcome than a page quietly shipping without its structured data.
  const json: string | undefined = JSON.stringify(value);
  if (typeof json !== 'string') return 'null';

  return json
    .replace(/</g, String.raw`\u003c`)
    .replace(/\u2028/g, String.raw`\u2028`)
    .replace(/\u2029/g, String.raw`\u2029`);
}
