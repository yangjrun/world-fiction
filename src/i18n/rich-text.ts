/**
 * Inline emphasis inside translated copy.
 *
 * Some body copy needs one emphasised phrase — "head height is measured to the
 * top of the head *including hair*" is the distinction this whole tool rests on,
 * and losing it loses the argument. That leaves three ways to get an `<em>` into
 * a translated sentence, and only one of them is safe here.
 *
 * Splitting the sentence into a key per fragment hard-codes English word order:
 * the emphasised phrase does not sit in the same place in German or Japanese, and
 * a translator handed three fragments cannot move it.
 *
 * Putting the literal `<em>` in the translation value and rendering with
 * `set:html` reads well and is safe for `<em>` alone — but it makes a raw-HTML
 * sink the house style for translated prose, and the next pages to be localised
 * carry inline `<a href>` in their copy. A translator-supplied `href` in a
 * raw-HTML sink is a different category of risk from an emphasis tag, and the
 * cheapest moment to not have that precedent is before it is set.
 *
 * So: placeholders. `{em}…{/em}` markers are parsed here into ordered chunks and
 * the caller maps them onto real `<em>` elements, interpolating every chunk's
 * text as text. Nothing reaches a raw-HTML sink, so `<script>`, `onerror=` and a
 * stray `<` in German prose are all inert by construction rather than by review.
 * Translation platforms also validate `{…}` placeholders natively, while they
 * routinely reorder, duplicate or mangle inline HTML tags.
 */

const OPEN = '{em}';
const CLOSE = '{/em}';

export interface RichTextChunk {
  /** Plain text. Never markup: the caller must interpolate it as text. */
  readonly text: string;
  /** Whether this chunk belongs inside an `<em>`. */
  readonly emphasis: boolean;
}

/**
 * Split `value` into ordered text and emphasised chunks.
 *
 * Malformed markers degrade to literal text rather than throwing or being
 * swallowed: an unclosed `{em}`, a stray `{/em}` and a nested `{em}` all stay
 * visible in the copy. A translator's mistake then looks like obviously wrong
 * prose — the kind a reviewer spots — instead of a blank paragraph, a truncated
 * sentence or a build that fails days later in an unrelated locale.
 *
 * Emphasis does not nest, because an `<em>` inside an `<em>` says nothing: the
 * first `{/em}` closes the pair and any inner marker is left in the text.
 */
export function parseEmphasis(value: string): RichTextChunk[] {
  const chunks: RichTextChunk[] = [];
  let rest = value;

  while (rest.length > 0) {
    const open = rest.indexOf(OPEN);
    if (open < 0) break;

    const close = rest.indexOf(CLOSE, open + OPEN.length);
    // Unclosed opener: everything left, marker included, is literal text.
    if (close < 0) break;

    const before = rest.slice(0, open);
    const emphasised = rest.slice(open + OPEN.length, close);

    if (before.length > 0) chunks.push({ text: before, emphasis: false });
    if (emphasised.length > 0) chunks.push({ text: emphasised, emphasis: true });

    rest = rest.slice(close + CLOSE.length);
  }

  if (rest.length > 0) chunks.push({ text: rest, emphasis: false });

  return chunks;
}
