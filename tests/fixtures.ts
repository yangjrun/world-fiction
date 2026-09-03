import type { PhotoSpec } from '@/lib/photo/types.js';

/**
 * US passport: 2x2in at 300dpi = 600x600px.
 * Head 1in..1 3/8in tall, eyes 1 1/8in..1 3/8in above the bottom edge.
 * 2in is 50.8mm exactly, which keeps the derived pixel size a round 600.
 */
export const US_PASSPORT: PhotoSpec = {
  id: 'us-passport',
  country: 'us',
  countryName: 'United States',
  document: 'passport',
  documentName: 'US passport photo',
  output: { kind: 'physical', widthMm: 50.8, heightMm: 50.8, dpi: 300 },
  headHeight: { minRatio: 25.4 / 50.8, maxRatio: 34.925 / 50.8 },
  eyeLine: { minRatio: 28.575 / 50.8, maxRatio: 34.925 / 50.8 },
  background: { description: 'Plain white or off-white', colors: ['#ffffff', '#fafafa'] },
  file: { format: 'jpeg' },
  sourceUrl: 'https://travel.state.gov/content/travel/en/passports/how-apply/photos.html',
};

/** Schengen visa: 35x45mm, head 32..36mm. No published eye-line rule. */
export const SCHENGEN_VISA: PhotoSpec = {
  id: 'schengen-visa',
  country: 'schengen',
  countryName: 'Schengen Area',
  document: 'visa',
  documentName: 'Schengen visa photo',
  output: { kind: 'physical', widthMm: 35, heightMm: 45, dpi: 300 },
  headHeight: { minRatio: 32 / 45, maxRatio: 36 / 45 },
  background: { description: 'Plain light grey or cream', colors: ['#f0f0f0', '#f5f0e6'] },
  file: { format: 'jpeg' },
  sourceUrl: 'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en',
};

/** US DV lottery: digital only, exactly 600x600px, hard 240KB ceiling. */
export const DV_LOTTERY: PhotoSpec = {
  id: 'us-dv-lottery',
  country: 'us',
  countryName: 'United States',
  document: 'dv-lottery',
  documentName: 'DV lottery photo',
  output: { kind: 'digital', widthPx: 600, heightPx: 600 },
  headHeight: { minRatio: 0.5, maxRatio: 0.69 },
  background: { description: 'Plain white or off-white', colors: ['#ffffff'] },
  file: { format: 'jpeg', maxBytes: 240 * 1024 },
  sourceUrl: 'https://dvprogram.state.gov/',
};
