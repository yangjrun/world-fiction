import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslations, getTranslations } from '@/i18n/ui';

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

  it('should handle multiple parameters', async () => {
    const t = useTranslations('en-US');
    await t.load();
    // Assuming we have a key like "greeting": "Hello {name}, welcome to {place}"
    const result = t.t('test.greeting', { name: 'Alice', place: 'Tokyo' });
    expect(result).toContain('Alice');
    expect(result).toContain('Tokyo');
  });
});
