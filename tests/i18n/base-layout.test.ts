import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { locales } from '@/i18n/config';
import { getTranslations } from '@/i18n/ui';

/**
 * `vitest.config.ts` runs plain vitest with no Astro compiler in front of it, so
 * the layout cannot be rendered here. These assertions read its source instead,
 * which is as brittle as it sounds — a reformat can break them — and is still
 * worth having: the hreflang narrowing below was already undone once by a
 * one-identifier edit that the whole unit suite passed either way, and the damage
 * (a page advertising eleven alternates when it built one) is invisible in the
 * rendered page. src/i18n/alternates.ts holds the logic and is unit-tested
 * properly; what is left is whether the layout renders the right one of its lists.
 */
const layout = readFileSync(
  fileURLToPath(new URL('../../src/layouts/BaseLayout.astro', import.meta.url)),
  'utf8',
);

/** The name of the list whose `.map()` renders `tag`. */
function listRendering(tag: string): string {
  const at = layout.indexOf(tag);
  expect(at, `the layout no longer renders ${tag}`).toBeGreaterThan(-1);

  let name: string | undefined;
  for (const match of layout.slice(0, at).matchAll(/(\w+)\.map\(/g)) name = match[1];
  return name ?? '(nothing)';
}

describe('BaseLayout advertises the narrowed hreflang set', () => {
  it('maps the translated alternates into <link rel="alternate">, not all of them', () => {
    // Two narrowings stand between `all` and this list -- the locales that publish
    // the page, then the locales whose bundle has actually been translated -- and
    // rendering `alternates` here undoes both in one identifier.
    expect(listRendering('<link rel="alternate" hreflang={alt.locale}')).toBe(
      'translationAlternates',
    );
  });

  it('keeps every locale in the language switcher', () => {
    // The mirror-image regression: narrowing the switcher as well would leave a
    // reader on a page that exists in one language with no route into their own.
    expect(listRendering('{languages[alt.locale].name}')).toBe('alternates');
  });

  it('takes every list from buildAlternates rather than deriving any locally', () => {
    expect(layout).toContain(
      '} = buildAlternates(pathname, locale, availableLocales, await getTranslatedLocales(), origin);',
    );
    // x-default and the canonical URL come from the same call, so neither can
    // disagree with the alternates about which locales carry this page in which
    // language. A locally computed canonical is how the untranslated locales end
    // up self-canonical again, each declaring itself the authority on an English
    // page it merely copies.
    expect(layout).toContain('xDefault,');
    expect(layout).toContain('canonical,');
    expect(layout).not.toMatch(/const xDefault =/);
    expect(layout).not.toMatch(/const canonical =/);
  });

  it('asks for the translated locales rather than assuming every locale', () => {
    // Passing `locales` as that argument is the whole regression spelled in one
    // word: eleven near-duplicate English pages, each advertised as a translation.
    expect(layout).toContain("import { getTranslatedLocales } from '@/i18n/translated';");
    expect(layout).not.toMatch(/buildAlternates\([^)]*availableLocales,\s*locales,/);
  });
});

/**
 * The document page is the only page that narrows its own hreflang set, and it
 * does that by handing the layout one prop. Everything above pins which of the
 * layout's two lists renders where, tests/i18n/alternates.test.ts pins the
 * narrowing itself, and tests/i18n/specs-locale.test.ts pins the list handed in —
 * nothing pinned the line that connects them.
 *
 * Drop `availableLocales` from that tag and the layout falls back to its default
 * of every locale: the guard that a page appears in its own hreflang set is
 * satisfied, no test goes red, and every document page advertises ten alternates
 * that 404. That is the defect the narrowing exists to prevent, shipping at exit 0.
 */
describe('the document page hands the layout its narrowed list', () => {
  const page = readFileSync(
    fileURLToPath(
      new URL('../../src/pages/[locale]/[country]/[document].astro', import.meta.url),
    ),
    'utf8',
  );

  /** The opening `<BaseLayout …>` tag, attributes and all. */
  function openingTag(): string {
    const start = page.indexOf('<BaseLayout');
    expect(start, 'the document page no longer renders BaseLayout').toBeGreaterThan(-1);
    const end = page.indexOf('>', start);
    expect(end, 'the BaseLayout tag is never closed').toBeGreaterThan(start);
    return page.slice(start, end + 1);
  }

  it('passes availableLocales to BaseLayout', () => {
    expect(openingTag()).toContain('availableLocales={availableLocales}');
  });

  it('builds that list from the locales that publish this document', () => {
    // The prop can be present and still wrong: passing `locales` there is the
    // same eleven-alternate regression spelled differently.
    expect(page).toContain('availableLocales: localesWithDocument(published, page.entry.data),');
  });
});

describe('the language switcher says when it leads somewhere else', () => {
  // On a document page "Deutsch" goes to the German home page, not to the German
  // version of that document, and the word "Deutsch" alone does not say so.
  it('marks only the entries whose target is not this same page', () => {
    expect(layout).toContain('title={alt.published ? undefined : switcherFallbackHint}');
    expect(layout).toContain('{!alt.published && (');
  });

  it('reads the hint from the bundle, and hides it visually rather than from readers', () => {
    expect(layout).toContain("t.t('switcher.home-fallback')");
    // Inside the link, so it joins the accessible name; `lang` is the page's own,
    // because the hint is written in the language being read, not the target's.
    expect(layout).toContain('<span class="sr-only" lang={locale}>');
  });

  it('has that hint in every locale bundle', async () => {
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      expect(dict['switcher.home-fallback'], `${locale} is missing the hint`).toBeTruthy();
    }
  });
});
