import type { Locale } from './config';
import { useTranslations } from './ui';

export async function photoGuide(locale: Locale) {
  const t = useTranslations(locale);
  await t.load();
  return {
    heading: t.t('examples.heading'),
    forward: t.t('examples.forward'),
    turned: t.t('examples.turned'),
    visible: t.t('examples.visible'),
    covered: t.t('examples.covered'),
    intro: t.t('examples.intro'),
    attribution: t.t('examples.attribution'),
    dimensions: t.t('examples.dimensions'),
    dimensionIntro: t.t('examples.dimension-intro'),
    limitation: t.t('examples.limitation'),
  };
}
