import type { Locale } from './config';

/**
 * The translation bundle for `locale`, read from `./translations/<locale>.json`.
 *
 * Derived from the locale rather than looked up in a hand-written map of eleven
 * dynamic imports. That map was a third copy of the locale list — after
 * `languages` in ./config.ts and `LOCALES` in ../../astro.locales.mjs, which a
 * test already compares by value — and its failure mode was silent: ten of its
 * eleven entries pointed at en-US.json, so every locale served English prose
 * under its own `lang` and `hreflang` while the build stayed green.
 *
 * Vite rewrites a template-literal import with a static directory and extension
 * into a glob of `./translations/*.json`, so every bundle is still statically
 * discoverable and bundled. The one restriction that rewrite carries is that the
 * variable part may not contain a `/`, and a locale tag never does.
 *
 * There is deliberately no fallback to en-US. A locale added to ./config.ts with
 * no bundle beside it now fails the build here, loudly, rather than serving
 * English under a `lang` and an `hreflang` that promise another language.
 */
export async function getTranslations(locale: Locale): Promise<Record<string, string>> {
  // Annotated rather than inferred: a template-literal import resolves to `any`,
  // where a static one would carry the JSON's own shape.
  const bundle = (await import(`./translations/${locale}.json`)) as {
    default: Record<string, string>;
  };
  return bundle.default;
}

/**
 * Substitute `{name}` placeholders in `text` from `params`, every occurrence.
 *
 * Exported so the substitution rules are testable against strings written for the
 * purpose. They used to be tested through two fixture keys, `test.greeting` and
 * `test.repeated`, that shipped inside the production bundle — and would have
 * shipped inside all eleven copies of it — asking every translator to translate
 * "Hello {name}, goodbye {name}" for a page that does not exist.
 */
export function interpolate(text: string, params?: Record<string, string>): string {
  if (params === undefined) return text;
  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    text,
  );
}

export function useTranslations(locale: Locale) {
  let dict: Record<string, string> = {};

  return {
    async load() {
      dict = await getTranslations(locale);
    },
    t(key: string, params?: Record<string, string>): string {
      return interpolate(dict[key] || key, params);
    },
  };
}
