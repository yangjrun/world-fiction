import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';
import { getTranslations, interpolate, useTranslations } from '@/i18n/ui';

/** A key the bundle must carry, named in the failure rather than `undefined`. */
function required(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (value === undefined) throw new Error(`missing translation key: ${key}`);
  return value;
}

const NOTE = '__note';

/**
 * Keys that are strings the app renders, as opposed to the `__readme` header and
 * the `<key>__note` documentation beside it.
 *
 * There is no longer a `test.` prefix to exclude. `test.greeting` and
 * `test.repeated` were fixtures for this file that shipped inside the production
 * bundle; with them gone, an exclusion for that prefix would quietly exempt any
 * real key beginning with `test.` from every check below.
 */
const isRenderedKey = (key: string): boolean => !key.startsWith('__') && !key.endsWith(NOTE);

const placeholdersIn = (value: string): string[] => value.match(/\{[^}]+}/g) ?? [];

/** Every `{…}` group in `value`, exactly as written. */
const braceGroups = (value: string): string[] => value.match(/\{[^{}]*\}/g) ?? [];

/** A group plainly meant as an emphasis marker, spelled canonically or not. */
const EM_SHAPED = /^\{\s*\/?\s*em\s*\}$/i;
/** A group plainly meant as a numbered link marker, spelled canonically or not. */
const LINK_SHAPED = /^\{\s*(\/?)\s*a\s*(\d+)\s*\}$/i;

/**
 * Emphasis markers in `value` that `src/i18n/rich-text.ts` will not recognise.
 *
 * The parser compares against the literal strings `{em}` and `{/em}`, so `{EM}`,
 * `{em }` and `{/ em}` are not markers at all: the pair is lost and the braces
 * render as visible junk. A balance scan and a raw-angle scan are both blind to
 * that, because neither looks at how a marker is spelled.
 */
function malformedEmMarkers(value: string): string[] {
  return braceGroups(value).filter(
    (group) => EM_SHAPED.test(group) && group !== '{em}' && group !== '{/em}',
  );
}

/**
 * Link markers in `value` the page cannot resolve: misspelled, or numbered past
 * the `linkCount` links it supplies.
 *
 * `parseLinks` matches `{a([1-9][0-9]*)}` and looks the number up in the page's
 * own list, so `{A1}`, `{a1 }`, `{a01}` and `{a3}` against two links are all
 * literal text — and a counting check that only looks for the markers it expects
 * never sees any of them.
 */
function malformedLinkMarkers(value: string, linkCount: number): string[] {
  return braceGroups(value).filter((group) => {
    const shaped = LINK_SHAPED.exec(group);
    if (shaped === null) return false;
    const digits = shaped[2];
    if (digits === undefined) return true;
    if (group !== `{${shaped[1] ?? ''}a${digits}}`) return true;
    if (!/^[1-9][0-9]*$/.test(digits)) return true;
    return Number(digits) > linkCount;
  });
}

interface PairScan {
  /** Which of the three ways a pair breaks happened, or `null`. */
  readonly problem: string | null;
  /** What each pair wraps, in order. */
  readonly spans: readonly string[];
}

/**
 * Scan `value` for balanced, non-nested `open`/`close` pairs and return what each
 * pair wraps.
 *
 * No regex, so the failure names which mistake was made. It hands back the spans
 * because balance alone cannot tell a translated pair from a lost one: `{em}{/em}`
 * is balanced, carries nothing, and `splitMarked` drops an empty span silently.
 */
function scanPairs(value: string, open: string, close: string): PairScan {
  const spans: string[] = [];
  let index = 0;
  let openedAt: number | null = null;

  while (index < value.length) {
    if (value.startsWith(open, index)) {
      if (openedAt !== null) return { problem: `nested ${open}`, spans };
      index += open.length;
      openedAt = index;
    } else if (value.startsWith(close, index)) {
      if (openedAt === null) return { problem: `stray ${close}`, spans };
      spans.push(value.slice(openedAt, index));
      openedAt = null;
      index += close.length;
    } else {
      index += 1;
    }
  }

  return { problem: openedAt === null ? null : `unclosed ${open}`, spans };
}

/** Assert every emphasis marker in `value` is one the parser matches, paired, and
 *  wrapped around something. Returns the emphasised spans. */
function expectWellFormedEmphasis(value: string, label: string): readonly string[] {
  expect(malformedEmMarkers(value), `${label} carries a near-miss emphasis marker`).toEqual([]);

  const { problem, spans } = scanPairs(value, '{em}', '{/em}');
  expect(problem, `${label} has a broken {em} pair`).toBeNull();
  for (const span of spans) {
    expect(span.trim(), `${label} emphasises an empty phrase`).not.toBe('');
  }

  return spans;
}

const pageSource = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../../src/pages/${name}`, import.meta.url)), 'utf8');

/** Every .astro file under src/pages, as a path. */
function astroFiles(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`],
    );
  return walk(fileURLToPath(new URL('../../src/pages', import.meta.url)))
    .map((file) => file.replace(/\\/g, '/'))
    .filter((file) => file.endsWith('.astro'));
}

const PRIVACY_PAGE = pageSource('[locale]/privacy.astro');
const HOME_PAGE = pageSource('[locale]/index.astro');
const ABOUT_PAGE = pageSource('[locale]/about.astro');

/** Whether a brace group is a markup marker rather than a value to substitute. */
const isMarker = (group: string): boolean => EM_SHAPED.test(group) || LINK_SHAPED.test(group);

/**
 * The placeholders a string substitutes a value into, markers excluded.
 *
 * A set, not a list: spec.band-length names {unit} twice in English and once is
 * perfectly good German ("33,0 - 36,0 mm"), so repetition is the translator's
 * business. Which values appear at all is not.
 */
const valuePlaceholders = (value: string): string[] =>
  [...new Set(braceGroups(value).filter((group) => !isMarker(group)))].sort();

/**
 * The keys a page renders through parseEmphasis.
 *
 * Everything else in the bundle reaches the page as plain text, so an {em} in it
 * renders with its braces showing. This list is the boundary that fact is asserted
 * against, so it is checked against the pages rather than trusted.
 */
const EMPHASISED_KEYS = ['home.how-p1', 'home.how-p2', 'home.how-p3', 'about.measures-p1'];

/**
 * How many links a page lends one rich-text key, read off the `const <name>` array
 * it declares them in.
 *
 * Read off the page rather than restated here: `{a3}` is junk only because the
 * privacy page passes two links, and a third added there must widen the bound
 * rather than trip it.
 */
function declaredLinkCount(page: string, source: string, name: string): number {
  const declaration = new RegExp(`const ${name}[^=]*=\\s*\\[([\\s\\S]*?)\\];`).exec(source);
  expect(declaration, `${page} no longer declares ${name} as an array literal`).not.toBeNull();
  return (declaration?.[1]?.match(/\bhref\s*:/g) ?? []).length;
}

/**
 * Every key a page renders through `parseLinks`, and how many links it is given.
 *
 * Anything absent from this map is given none, so a link marker in it can only
 * ever render with its braces showing.
 */
function suppliedLinks(): Map<string, number> {
  return new Map([
    ['privacy.ads-p2', declaredLinkCount('privacy.astro', PRIVACY_PAGE, 'adLinks')],
    ['home.empty', declaredLinkCount('index.astro', HOME_PAGE, 'emptyLinks')],
  ]);
}

describe('Translation system', () => {
  it('should load English translations', async () => {
    const dict = await getTranslations('en-US');
    expect(dict['nav.home']).toBe('All photo specs');
    expect(dict['nav.about']).toBe('About');
  });

  it('should return key if translation missing', async () => {
    const t = useTranslations('en-US');
    await t.load();
    expect(t.t('non.existent.key')).toBe('non.existent.key');
  });

  it('should interpolate parameters', async () => {
    const t = useTranslations('en-US');
    await t.load();
    const result = t.t('editor.heading', { documentName: 'US passport' });
    expect(result).toBe('Make your US passport');
  });
});

/**
 * Placeholder substitution, on strings written here for the purpose.
 *
 * These two rules used to be tested through `test.greeting` and `test.repeated`,
 * fixture keys that lived in the production bundle. That bundle now exists in
 * eleven copies, so a fixture inside it is a string every translator is asked to
 * translate — and a placeholder rule they are asked to honour — for a page that
 * does not exist. `interpolate` is the function `t()` runs, exported so the rules
 * can be stated without shipping their inputs to eleven languages.
 */
describe('interpolate', () => {
  it('substitutes several distinct placeholders', () => {
    expect(
      interpolate('Hello {name}, welcome to {place}', { name: 'Alice', place: 'Tokyo' }),
    ).toBe('Hello Alice, welcome to Tokyo');
  });

  it('substitutes every occurrence of a repeated placeholder', () => {
    // Not hypothetical: spec.band-length prints {unit} twice, so a
    // first-occurrence-only substitution would ship "33.0 mm – 36.0 {unit}".
    expect(interpolate('Hello {name}, goodbye {name}', { name: 'Bob' })).toBe(
      'Hello Bob, goodbye Bob',
    );
  });

  it('leaves a placeholder the caller did not supply', () => {
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
    expect(interpolate('Hello {name}')).toBe('Hello {name}');
  });
});

/**
 * Every locale is served from the file named after it.
 *
 * `src/i18n/ui.ts` used to hold a hand-written map of eleven dynamic imports in
 * which ten entries pointed at `en-US.json`, and nothing here noticed: every
 * assertion below that iterates `locales` was reading the same English bundle
 * eleven times, so eleven "in every locale" guarantees were one guarantee about
 * en-US. The loader is derived from the locale now; this is the guard that it
 * resolves where it claims to, stated against the files on disk rather than
 * against the loader that reads them.
 */
describe('Locale bundles', () => {
  const TRANSLATIONS_DIR = new URL('../../src/i18n/translations/', import.meta.url);

  it('loads each locale from the file named after it', async () => {
    for (const locale of locales) {
      const onDisk: unknown = JSON.parse(
        readFileSync(fileURLToPath(new URL(`${locale}.json`, TRANSLATIONS_DIR)), 'utf8'),
      );
      expect(
        await getTranslations(locale),
        `${locale} is not loaded from ${locale}.json`,
      ).toEqual(onDisk);
    }
  });

  it('carries exactly the en-US key set, in every locale', async () => {
    // A key missing from a bundle renders its own name as body copy, and a key
    // no other bundle has is a string nobody renders. Both are invisible until
    // somebody reads that page in that language, which for ten of these is
    // nobody on this team.
    const expected = Object.keys(await getTranslations('en-US')).sort();
    expect(expected.length, 'the en-US bundle has shrunk unexpectedly').toBeGreaterThan(100);

    for (const locale of locales) {
      expect(Object.keys(await getTranslations(locale)).sort(), `${locale} key set`).toEqual(
        expected,
      );
    }
  });

  it('substitutes the same values as en-US in every key, in every locale', async () => {
    // The per-key assertions elsewhere in this file name {count}, {date} and
    // {documentName}, which leaves the other placeholders unguarded: a translator
    // who drops {unit} from spec.band-length ships "33.0 mm - 36.0" with the unit
    // missing, and one who invents {units} ships a sentence with braces in it.
    // Neither is visible except by reading that row of that table in that language.
    const source = await getTranslations(defaultLocale);

    for (const locale of locales) {
      if (locale === defaultLocale) continue;
      const dict = await getTranslations(locale);

      for (const [key, value] of Object.entries(source)) {
        if (!isRenderedKey(key)) continue;
        expect(
          valuePlaceholders(required(dict, key)),
          `${locale} ${key} does not substitute the same values as ${defaultLocale}: a ` +
            `placeholder the page supplies and the copy never names leaves that fact out ` +
            `of the sentence, and one the page does not supply renders as literal braces`,
        ).toEqual(valuePlaceholders(value));
      }
    }
  });

  it('holds a bundle for every configured locale and nothing else', () => {
    // A bundle with no locale — `en-GB.json`, or a leftover `en-US.json.bak` —
    // is never served and never noticed. A locale with no bundle now fails the
    // build inside getTranslations, which the test above exercises.
    const bundles = readdirSync(fileURLToPath(TRANSLATIONS_DIR)).sort();
    expect(bundles).toEqual(locales.map((locale) => `${locale}.json`).sort());
  });
});

/**
 * Marker spelling, across every string in every bundle.
 *
 * `src/i18n/rich-text.ts` matches the literal strings `{em}`, `{/em}`, `{aN}` and
 * `{/aN}`; anything else is not a marker. The per-page checks further down look at
 * the two keys the pages actually parse, which leaves two gaps: a near-miss
 * spelling passes every one of them, and a marker in a key no page parses is junk
 * on the page just the same.
 */
describe('Rich-text markers', () => {
  it('spells every emphasis marker the way the parser matches it, in every locale', async () => {
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const [key, value] of Object.entries(dict)) {
        if (!isRenderedKey(key)) continue;
        expectWellFormedEmphasis(value, `${locale} ${key}`);
      }
    }
  });

  it('parses emphasis in exactly the keys named here', () => {
    // The assertion below is only as good as this list, so the list is pinned to the
    // pages. A third page that starts calling parseEmphasis without being added here
    // would have its emphasis rejected as junk; one that stops calling it would leave
    // its keys exempt from the rejection.
    const parsers: readonly (readonly [string, string])[] = [
      ['[locale]/index.astro', HOME_PAGE],
      ['[locale]/about.astro', ABOUT_PAGE],
    ];

    for (const [name, source] of parsers) {
      expect(source, `${name} no longer calls parseEmphasis`).toContain('parseEmphasis(');
    }
    for (const key of EMPHASISED_KEYS) {
      expect(
        parsers.some(([, source]) => source.includes(`'${key}'`)),
        `${key} is not named by any page that parses emphasis`,
      ).toBe(true);
    }

    const parsing = astroFiles().filter((file) =>
      readFileSync(file, 'utf8').includes('parseEmphasis('),
    );
    expect(
      parsing.map((file) => file.slice(file.indexOf('src/pages/') + 'src/pages/'.length)).sort(),
      'a page has started or stopped parsing emphasis without EMPHASISED_KEYS being updated',
    ).toEqual(parsers.map(([name]) => name).sort());
  });

  it('never emphasises a string no page parses', async () => {
    // The inverse the link markers already had and emphasis did not: `{em}` is
    // spelled correctly in all 99 of the keys parseEmphasis never sees, and every
    // other assertion in this file waves it through while the page shows the braces.
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const [key, value] of Object.entries(dict)) {
        if (!isRenderedKey(key) || EMPHASISED_KEYS.includes(key)) continue;
        expect(
          braceGroups(value).filter((group) => EM_SHAPED.test(group)),
          `${locale} ${key} carries an emphasis marker, and no page parses that key`,
        ).toEqual([]);
      }
    }
  });

  it('catches the near misses these scans exist for', () => {
    // Guards the guard: every case here passed the balance-and-raw-angle pair of
    // checks that used to stand alone.
    expect(malformedEmMarkers('{EM}hair{/EM}')).toEqual(['{EM}', '{/EM}']);
    expect(malformedEmMarkers('{em }hair{/em }')).toEqual(['{em }', '{/em }']);
    expect(malformedEmMarkers('{ /em }')).toEqual(['{ /em }']);
    expect(malformedEmMarkers('{em}hair{/em}')).toEqual([]);

    expect(scanPairs('{em}{/em}', '{em}', '{/em}').spans).toEqual(['']);
    expect(scanPairs('{em}hair', '{em}', '{/em}').problem).toBe('unclosed {em}');
    expect(scanPairs('hair{/em}', '{em}', '{/em}').problem).toBe('stray {/em}');
    expect(scanPairs('{em}{em}hair{/em}', '{em}', '{/em}').problem).toBe('nested {em}');
    expect(scanPairs('{em}hair{/em}', '{em}', '{/em}')).toEqual({ problem: null, spans: ['hair'] });

    expect(malformedLinkMarkers('{A1}x{/a1}', 2)).toEqual(['{A1}']);
    expect(malformedLinkMarkers('{a1 }x{/a1}', 2)).toEqual(['{a1 }']);
    expect(malformedLinkMarkers('{a3}x{/a3}', 2)).toEqual(['{a3}', '{/a3}']);
    expect(malformedLinkMarkers('{a01}x{/a01}', 2)).toEqual(['{a01}', '{/a01}']);
    expect(malformedLinkMarkers('{a1}x{/a1}{a2}y{/a2}', 2)).toEqual([]);
    expect(malformedLinkMarkers('{count} verified', 2)).toEqual([]);
  });
});

/**
 * The home page is the first page that renders its whole body from the bundle,
 * so these guard the two ways that goes silently wrong: body copy dropping back
 * to hardcoded English (the keys disappear and `t()` renders the bare key), and
 * the document head being collapsed onto the on-page headings.
 */
describe('Home page translations', () => {
  const paragraphKeys = ['home.how-p1', 'home.how-p2', 'home.how-p3'];

  it('carries the how-it-works body copy as keys, not hardcoded prose', async () => {
    const dict = await getTranslations('en-US');
    for (const key of paragraphKeys) {
      expect(required(dict, key).length).toBeGreaterThan(100);
    }
  });

  it('carries inline emphasis as placeholders and no raw markup, in every locale', async () => {
    // The page maps `{em}…{/em}` onto real <em> elements and interpolates every
    // chunk as text, so a raw `<` in a translated value can only ever render as
    // visible junk. Asserted across every locale, not just the source one: ten
    // bundles are still to be written by translators who never see this compiled.
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const key of paragraphKeys) {
        const value = required(dict, key);
        expect(value.includes('<'), `${locale} ${key} carries a raw <`).toBe(false);
        expect(value.includes('>'), `${locale} ${key} carries a raw >`).toBe(false);
        expectWellFormedEmphasis(value, `${locale} ${key}`);
      }
    }
  });

  it('still emphasises something, in every locale', async () => {
    // "including hair" is the whole distinction between this tool and a face
    // crop. Which paragraph carries it is a translator's choice; dropping the
    // emphasis from all three is a copy regression that every structural check
    // above waves through, because a bundle with no pairs at all is well-formed.
    //
    // Per locale rather than en-US only: the mistake this catches is a translator
    // losing the pair, and the source copy cannot show that.
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      const emphasised = paragraphKeys.flatMap((key) =>
        expectWellFormedEmphasis(required(dict, key), `${locale} ${key}`),
      );
      expect(
        emphasised.length,
        `${locale} emphasises nothing in the how-it-works copy`,
      ).toBeGreaterThan(0);
    }
  });

  it('keeps the document-head strings separate from the on-page headings', async () => {
    // home.subtitle is 210 characters and home.title is not the tuned SEO
    // title; reusing either in <head> ships a description far past the 140-170
    // window src/content.config.ts enforces for every other page.
    const dict = await getTranslations('en-US');
    const metaTitle = required(dict, 'home.meta-title');
    const metaDescription = required(dict, 'home.meta-description');

    expect(metaTitle).not.toBe(required(dict, 'home.title'));
    expect(metaDescription).not.toBe(required(dict, 'home.subtitle'));

    expect(metaTitle.length).toBeLessThanOrEqual(70);
    expect(metaDescription.length).toBeGreaterThanOrEqual(50);
    expect(metaDescription.length).toBeLessThanOrEqual(170);
  });
});

/**
 * The document page is the other page rendering its chrome from the bundle, and
 * nothing type-checks a translation key: `t()` answers a missing one with the key
 * itself, so a typo here or a bundle that never gains the key ships `faq.heading`
 * as a heading. The ten bundles below en-US are still to be written.
 */
describe('Document page translations', () => {
  const pageKeys = [
    'aria.breadcrumb',
    'nav.home',
    'requirements.heading',
    'requirements.source',
    'requirements.checked',
    'rejections.heading',
    'faq.heading',
    'schema.app-name',
    'spec.size',
    'spec.head-height',
    'spec.eye-height',
    'spec.background',
    'spec.file',
  ];

  it('carries every key the page and its spec table render, in every locale', async () => {
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const key of pageKeys) {
        expect(dict[key], `${locale} is missing ${key}`).toBeTruthy();
      }
    }
  });

  it('keeps the document name a parameter of the JSON-LD application name', async () => {
    // That block now claims `inLanguage`, so its one human-readable string is
    // translated; a bundle that drops the placeholder would give all five
    // documents the same name in search results.
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      expect(dict['schema.app-name'], locale).toContain('{documentName}');
    }
  });
});

/**
 * The about, privacy and terms pages moved under `src/pages/[locale]/` and now
 * render every heading and every paragraph from the bundle. Two failure modes
 * matter enough to guard: a key missing from a locale ships its own name as body
 * copy — `privacy.children-p1` where a compliance statement should be — and the
 * privacy page's two outbound links live as markers whose URLs stay in the page,
 * which only holds while no bundle starts carrying a URL of its own.
 */
describe('Static page translations', () => {
  const aboutKeys = [
    'about.meta-title',
    'about.meta-description',
    'about.title',
    'about.why-heading',
    'about.why-p1',
    'about.why-p2',
    'about.measures-heading',
    'about.measures-p1',
    'about.measures-p2',
    'about.measures-p3',
    'about.upload-heading',
    'about.upload-p1',
    'about.honest-heading',
    'about.honest-p1',
    'about.honest-p2',
    'about.paid-heading',
    'about.paid-p1',
  ];

  const privacyKeys = [
    'privacy.meta-title',
    'privacy.meta-description',
    'privacy.title',
    'privacy.photos-heading',
    'privacy.photos-p1',
    'privacy.photos-p2',
    'privacy.collected-heading',
    'privacy.collected-p1',
    'privacy.ads-heading',
    'privacy.ads-p1',
    'privacy.ads-p2',
    'privacy.rights-heading',
    'privacy.rights-p1',
    'privacy.children-heading',
    'privacy.children-p1',
    'privacy.changes-heading',
    'privacy.changes-p1',
  ];

  const termsKeys = [
    'terms.meta-title',
    'terms.meta-description',
    'terms.title',
    'terms.provides-heading',
    'terms.provides-p1',
    'terms.accuracy-heading',
    'terms.accuracy-p1',
    'terms.accuracy-p2',
    'terms.use-heading',
    'terms.use-p1',
    'terms.liability-heading',
    'terms.liability-p1',
    'terms.ip-heading',
    'terms.ip-p1',
    'terms.changes-heading',
    'terms.changes-p1',
  ];

  const pageKeys = [...aboutKeys, ...privacyKeys, ...termsKeys, 'legal.updated'];

  it('carries every key the three pages render, in every locale', async () => {
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const key of pageKeys) {
        expect(dict[key], `${locale} is missing ${key}`).toBeTruthy();
      }
    }
  });

  it('keeps each document-head string tuned, and apart from the page copy', async () => {
    // These three pages each carry a `title` and `description` written for search
    // results, not the on-page heading and not the opening paragraph. The about
    // page is the one whose heading is plainly not its title ("About"); privacy
    // and terms legitimately share theirs with the heading, so the guard there is
    // the length window every other page in the site is held to.
    const dict = await getTranslations('en-US');

    expect(required(dict, 'about.meta-title')).not.toBe(required(dict, 'about.title'));

    for (const page of ['about', 'privacy', 'terms']) {
      const title = required(dict, `${page}.meta-title`);
      const description = required(dict, `${page}.meta-description`);

      expect(title.length, `${page} title`).toBeLessThanOrEqual(70);
      expect(description.length, `${page} description`).toBeGreaterThanOrEqual(50);
      expect(description.length, `${page} description`).toBeLessThanOrEqual(170);
    }

    expect(required(dict, 'about.meta-description')).not.toBe(required(dict, 'about.why-p1'));
    expect(required(dict, 'privacy.meta-description')).not.toBe(
      required(dict, 'privacy.photos-p1'),
    );
    expect(required(dict, 'terms.meta-description')).not.toBe(required(dict, 'terms.provides-p1'));
  });

  it('keeps the emphasis on the head measurement, balanced, in every locale', async () => {
    // The about page maps `{em}…{/em}` onto a real <em>; one marker without the
    // other loses the emphasis silently, and a raw `<` could only ever render as
    // visible junk because every chunk interpolates as text.
    for (const locale of locales) {
      const value = required(await getTranslations(locale), 'about.measures-p1');
      expect(value.split('{em}'), `${locale} opens {em} more than once`).toHaveLength(2);
      expect(value.split('{/em}'), `${locale} closes {/em} more than once`).toHaveLength(2);
      expect(value.includes('<'), `${locale} carries a raw <`).toBe(false);
      // Exactly one pair, spelled the way the parser matches it, around something:
      // the two counts above are satisfied by `{em}{/em}`, which emphasises
      // nothing and which parseEmphasis drops without a word.
      expect(expectWellFormedEmphasis(value, `${locale} about.measures-p1`)).toHaveLength(1);
    }
  });

  it('keeps the advertising links as markers, with their addresses out of the bundle', async () => {
    // `{a1}` and `{a2}` say which words link where; src/pages/[locale]/privacy.astro
    // says where that is. A bundle that grew a URL of its own would mean a
    // translator had been handed a destination to get wrong — or to redirect.
    const linkCount = suppliedLinks().get('privacy.ads-p2') ?? 0;
    expect(linkCount, 'the privacy page no longer lends its ad paragraph two links').toBe(2);

    for (const locale of locales) {
      const value = required(await getTranslations(locale), 'privacy.ads-p2');

      for (const marker of ['{a1}', '{/a1}', '{a2}', '{/a2}']) {
        expect(value.split(marker), `${locale} does not use ${marker} exactly once`).toHaveLength(
          2,
        );
      }

      expect(value, `${locale} carries a URL in its copy`).not.toMatch(/https?:\/\//);
      expect(value.includes('<'), `${locale} carries a raw <`).toBe(false);

      // `{A1}`, `{a1 }` and `{a3}` all survive the four counts above: the first
      // two because they are different strings from the markers being counted,
      // the third because nothing counts it. None is a marker the parser matches.
      // The first two render with their braces showing; `{a3}` names a link the
      // page never passed, which parseLinks also leaves in the copy as plain text.
      expect(
        malformedLinkMarkers(value, linkCount),
        `${locale} privacy.ads-p2 carries a link marker the page cannot resolve`,
      ).toEqual([]);

      // And each pair has to wrap something. `{a1}{/a1}` is one `{a1}` and one
      // `{/a1}`, links no words at all, and is dropped without a word.
      for (let index = 1; index <= linkCount; index += 1) {
        const { problem, spans } = scanPairs(value, `{a${index}}`, `{/a${index}}`);
        expect(problem, `${locale} has a broken {a${index}} pair`).toBeNull();
        expect(spans, `${locale} does not wrap one phrase in {a${index}}`).toHaveLength(1);
        expect(spans[0]?.trim(), `${locale} links an empty phrase in {a${index}}`).not.toBe('');
      }
    }
  });

  it('resolves every link marker against the links its own page supplies', async () => {
    // parseLinks runs on two keys, and each is given its links by the page that
    // renders it. An `{a1}` in any other string is not a link and never becomes
    // one: it renders, braces and all, in the middle of a sentence. An `{a2}` in
    // `home.empty`, which is lent one link, does the same.
    const supplied = suppliedLinks();
    expect(supplied.size, 'no key is recorded as being lent links').toBeGreaterThan(1);

    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const [key, value] of Object.entries(dict)) {
        if (!isRenderedKey(key)) continue;
        const count = supplied.get(key) ?? 0;

        expect(
          malformedLinkMarkers(value, count),
          `${locale} ${key} carries a link marker its page cannot resolve`,
        ).toEqual([]);

        // Every link the page lends has to be used, exactly once, around
        // something. A page supplying a link no copy names is dead code, and a
        // translator who drops the pair loses the link in silence.
        for (let index = 1; index <= count; index += 1) {
          const { problem, spans } = scanPairs(value, `{a${index}}`, `{/a${index}}`);
          expect(problem, `${locale} ${key} has a broken {a${index}} pair`).toBeNull();
          expect(spans, `${locale} ${key} does not wrap one phrase in {a${index}}`).toHaveLength(1);
          expect(spans[0]?.trim(), `${locale} ${key} links an empty phrase`).not.toBe('');
        }
      }
    }
  });

  it('keeps the verified-spec count and the updated date as parameters', async () => {
    // Both are supplied by the page: the count is a live query, and the date is
    // when a published document last changed. A bundle that drops the placeholder
    // ships a sentence with the fact missing from it.
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      expect(required(dict, 'about.honest-p1'), locale).toContain('{count}');
      expect(required(dict, 'legal.updated'), locale).toContain('{date}');
    }
  });
});

/**
 * Translator documentation.
 *
 * The bundle is a flat `Record<string, string>` because the loader, `t()` and
 * every consumer treat it as one, so the documentation a translator needs has to
 * live in that same flat shape: a `__readme` at the top, and a `<key>__note`
 * beside anything carrying a placeholder. A separate notes file would not travel
 * with the ten copies of this bundle that now sit beside it, and JSON has no
 * comment syntax, so a header block has to be a key regardless.
 *
 * The specific hazards these notes exist for: `{minPercent}` and `{maxPercent}`
 * arrive from Intl with their `%` sign already attached, so `{minPercent}%` ships
 * `50%%`; and `{physical}` and `{pixels}` are whole phrases built from
 * `spec.dimensions`, not bare numbers. Neither is guessable from the pattern.
 */
describe('Translator documentation', () => {
  it('keeps the bundle a flat map of strings', async () => {
    // Nesting notes under an object per key is the tidier-looking shape, and it
    // would break `getTranslations`, `t()` and every test in this file at once.
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const [key, value] of Object.entries(dict)) {
        expect(typeof value, `${locale} ${key}`).toBe('string');
      }
    }
  });

  it('opens with a readme that states the placeholder rule', async () => {
    const dict = await getTranslations('en-US');
    const readme = dict['__readme'];
    expect(readme).toBeTruthy();
    expect(readme).toContain('{braces}');
    expect(readme).toContain(NOTE);
  });

  it('documents every string that carries a placeholder', async () => {
    const dict = await getTranslations('en-US');
    const documented = Object.keys(dict).filter(
      (key) => isRenderedKey(key) && placeholdersIn(dict[key] ?? '').length > 0,
    );

    // Guards the guard: a detector that matches nothing would pass silently.
    expect(documented.length).toBeGreaterThan(5);
    for (const key of documented) {
      expect(dict[`${key}${NOTE}`], `${key} has a placeholder and no ${NOTE}`).toBeTruthy();
    }
  });

  it('has no note documenting a string that is not there', async () => {
    // A note left behind by a renamed key is documentation for a string nobody
    // renders, and the next translator wastes time on it.
    const dict = await getTranslations('en-US');
    for (const key of Object.keys(dict).filter((k) => k.endsWith(NOTE))) {
      const subject = key.slice(0, -NOTE.length);
      expect(dict[subject], `${key} documents nothing`).toBeTruthy();
    }
  });

  it('mentions in every note each placeholder its string carries', async () => {
    // A note that has drifted from its pattern is worse than no note: it is
    // wrong with authority.
    const dict = await getTranslations('en-US');
    for (const [key, value] of Object.entries(dict)) {
      if (!isRenderedKey(key)) continue;
      const note = dict[`${key}${NOTE}`];
      if (note === undefined) continue;
      for (const placeholder of placeholdersIn(value)) {
        expect(note, `${key}${NOTE} never mentions ${placeholder}`).toContain(placeholder);
      }
    }
  });
});
