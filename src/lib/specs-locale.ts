import type { Locale } from '@/i18n/config';

/**
 * Whether a `specs` collection entry id belongs to `locale`.
 *
 * Entry ids come from Astro's glob loader, which slugifies **every** path
 * segment of the id: `src/content/specs/en-US/us-passport.md` arrives as
 * `en-us/us-passport`, lowercased. Comparing that segment to the locale tag
 * with `===` is therefore false for every locale, and it fails silently —
 * an empty collection query is not an error, so every page would quietly
 * disappear from the build while it still exited 0.
 *
 * The comparison is case-insensitive instead, which also keeps working if a
 * `generateId` is ever added and the segment stops being lowercased. The locale
 * must be a whole leading segment followed by something: a stray
 * `src/content/specs/en-US.md` sits outside every locale directory and is not
 * a locale-scoped entry.
 *
 * Kept in its own module, apart from `./specs.ts`, so it is unit-testable:
 * `specs.ts` imports `astro:content`, which only resolves inside an Astro build.
 */
export function matchesLocale(entryId: string, locale: Locale): boolean {
  const separator = entryId.indexOf('/');
  if (separator < 0) return false;
  return entryId.slice(0, separator).toLowerCase() === locale.toLowerCase();
}

/** A country and document slug pair, identifying one page across locales. */
export interface DocumentId {
  readonly country: string;
  readonly document: string;
}

/** What one locale publishes, as fed to `localesWithDocument`. */
export interface LocalePublications {
  readonly locale: Locale;
  readonly documents: readonly DocumentId[];
}

/**
 * The locales that publish `country`/`document`, in the order given.
 *
 * This is the hreflang set for one document page, and it is not "every locale".
 * A locale contributes a page only once its spec is marked `verified`, so a
 * document can exist in en-US and nowhere else — which is the state of every
 * document today. An `hreflang` naming a URL that 404s is an error Google can
 * charge to the whole cluster, discounting the locales that do exist along with
 * the ones that do not, so the page has to advertise what it actually built.
 *
 * Pure, and therefore here rather than in `./specs.ts`, for the same reason as
 * `matchesLocale`: `specs.ts` imports `astro:content`, which resolves only inside
 * an Astro build, and this is the logic worth unit-testing.
 */
export function localesWithDocument(
  published: readonly LocalePublications[],
  { country, document }: DocumentId,
): Locale[] {
  return published
    .filter(({ documents }) =>
      documents.some((entry) => entry.country === country && entry.document === document),
    )
    .map(({ locale }) => locale);
}
