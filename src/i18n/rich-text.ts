/**
 * Inline markup inside translated copy.
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
 * sink the house style for translated prose, and the privacy page carries two
 * inline `<a href>` inside one paragraph. A translator-supplied `href` in a
 * raw-HTML sink is a different category of risk from an emphasis tag, and the
 * cheapest moment to not have that precedent is before it is set.
 *
 * So: placeholders. `{em}…{/em}` and `{a1}…{/a1}` markers are parsed here into
 * ordered chunks and the caller maps them onto real `<em>` and `<a>` elements,
 * interpolating every chunk's text as text. Nothing reaches a raw-HTML sink, so
 * `<script>`, `onerror=` and a stray `<` in German prose are all inert by
 * construction rather than by review. Translation platforms also validate `{…}`
 * placeholders natively, while they routinely reorder, duplicate or mangle inline
 * HTML tags.
 */

const EM_OPEN = '{em}';
const EM_CLOSE = '{/em}';

/** `{a1}`, `{a2}`, … — the digits pick which link the page supplied. */
const LINK_OPEN_PATTERN = String.raw`\{a([1-9][0-9]*)\}`;

export interface RichTextChunk {
  /** Plain text. Never markup: the caller must interpolate it as text. */
  readonly text: string;
  /** Whether this chunk belongs inside an `<em>`. */
  readonly emphasis: boolean;
}

/**
 * One link a page lends to a translated sentence.
 *
 * Every field comes from the page and none is ever read from a translation. A
 * bundle is the least trustworthy input in this build — ten of the eleven are
 * written by people who never see this file — and a translated `href` is an open
 * redirect, or a `javascript:` URL, one careless paste away. The marker in the
 * copy says only *which* link a phrase belongs to; the page owns where it goes
 * and how it opens.
 */
export interface RichTextLink {
  readonly href: string;
  readonly rel?: string;
  readonly target?: string;
}

export interface RichTextLinkChunk {
  /** Plain text. Never markup: the caller must interpolate it as text. */
  readonly text: string;
  /** The link this chunk sits inside, or `null` for text outside every link. */
  readonly link: RichTextLink | null;
}

/** An opening marker the scanner recognised, and what its contents carry. */
interface Opener<M> {
  /** Where the opening marker starts in the text being scanned. */
  readonly index: number;
  /** Length of the opening marker. */
  readonly length: number;
  /** The exact closing marker that ends this pair. */
  readonly close: string;
  /** What to attach to the text between the pair. */
  readonly meta: M;
}

interface MarkedChunk<M> {
  readonly text: string;
  /** `null` for text outside every pair. */
  readonly meta: M | null;
}

/**
 * Split `value` on one kind of marker pair, in order.
 *
 * Shared by both parsers below so their failure behaviour cannot drift: whatever
 * a translator does to a pair, emphasis and links degrade the same way. Malformed
 * markers stay in the copy as literal text rather than throwing or being
 * swallowed — an unclosed opener, a stray closer and a nested opener all remain
 * visible. A translator's mistake then looks like obviously wrong prose, the kind
 * a reviewer spots, instead of a blank paragraph, a truncated sentence or a build
 * that fails days later in an unrelated locale.
 *
 * Pairs do not nest: the first matching closer wins and any inner marker is left
 * in the text.
 */
function splitMarked<M>(
  value: string,
  findOpener: (rest: string) => Opener<M> | null,
): MarkedChunk<M>[] {
  const chunks: MarkedChunk<M>[] = [];
  let rest = value;

  while (rest.length > 0) {
    const opener = findOpener(rest);
    if (opener === null) break;

    const contentStart = opener.index + opener.length;
    const close = rest.indexOf(opener.close, contentStart);
    // Unclosed opener: everything left, marker included, is literal text.
    if (close < 0) break;

    const before = rest.slice(0, opener.index);
    const marked = rest.slice(contentStart, close);

    if (before.length > 0) chunks.push({ text: before, meta: null });
    if (marked.length > 0) chunks.push({ text: marked, meta: opener.meta });

    rest = rest.slice(close + opener.close.length);
  }

  if (rest.length > 0) chunks.push({ text: rest, meta: null });

  return chunks;
}

/**
 * Split `value` into ordered text and emphasised chunks.
 *
 * Emphasis does not nest, because an `<em>` inside an `<em>` says nothing: the
 * first `{/em}` closes the pair and any inner marker is left in the text. See
 * `splitMarked` for how the other malformed cases degrade.
 */
export function parseEmphasis(value: string): RichTextChunk[] {
  const marked = splitMarked<boolean>(value, (rest) => {
    const index = rest.indexOf(EM_OPEN);
    if (index < 0) return null;
    return { index, length: EM_OPEN.length, close: EM_CLOSE, meta: true };
  });

  return marked.map(({ text, meta }) => ({ text, emphasis: meta ?? false }));
}

/**
 * Split `value` into ordered text and linked chunks, `{a1}` naming `links[0]`.
 *
 * Two links in one paragraph have to be told apart, and the marker is numbered
 * rather than named. A key per link splits the sentence and pins its word order,
 * which is the same objection that rules out fragment keys for emphasis. A named
 * marker such as `{a:adcenter}` reads better but invites names that describe a
 * destination, and a translator who tidies a name silently loses the link. A
 * number carries no meaning to lose: keep the pair, keep both of its members, and
 * put them around whichever words name the destination in your language.
 *
 * A number with no link behind it — `{a3}` where the page passed two — is left in
 * the copy as literal text and the scan carries on, so one bad marker cannot cost
 * the paragraph its other link. A pair closed by the wrong number (`{a1}…{/a2}`)
 * is an unclosed opener, and degrades the same way as one in `parseEmphasis`.
 */
export function parseLinks(
  value: string,
  links: readonly RichTextLink[],
): RichTextLinkChunk[] {
  const marked = splitMarked<RichTextLink>(value, (rest) => {
    // Built per call: a module-level /g/ regex carries `lastIndex` between calls
    // and would start each scan wherever the previous one happened to stop.
    const pattern = new RegExp(LINK_OPEN_PATTERN, 'g');

    for (let match = pattern.exec(rest); match !== null; match = pattern.exec(rest)) {
      const digits = match[1];
      if (digits === undefined) continue;
      const link = links[Number(digits) - 1];
      if (link === undefined) continue;

      const marker = `{a${digits}}`;
      return { index: match.index, length: marker.length, close: `{/a${digits}}`, meta: link };
    }

    return null;
  });

  return marked.map(({ text, meta }) => ({ text, link: meta }));
}
