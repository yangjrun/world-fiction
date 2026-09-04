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
