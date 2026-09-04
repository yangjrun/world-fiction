import { describe, it, expect } from 'vitest';
import { parseEmphasis } from '@/i18n/rich-text';

/**
 * The parser is the whole reason translated body copy no longer needs a
 * raw-HTML sink, so these tests carry two jobs: that emphasis survives being
 * moved around a sentence by a translator, and that nothing a translator can
 * type turns into markup.
 */
describe('parseEmphasis', () => {
  it('splits a balanced pair mid-sentence', () => {
    expect(parseEmphasis('to the top of the head {em}including hair{/em}, which is why')).toEqual([
      { text: 'to the top of the head ', emphasis: false },
      { text: 'including hair', emphasis: true },
      { text: ', which is why', emphasis: false },
    ]);
  });

  it('returns a value with no placeholder as a single plain chunk', () => {
    const value = 'If your original photo is framed too tightly, the tool says so.';
    expect(parseEmphasis(value)).toEqual([{ text: value, emphasis: false }]);
  });

  it('handles emphasis at the very start of a value', () => {
    // Word order moves under translation; German and Japanese will not keep the
    // emphasised phrase where English put it.
    expect(parseEmphasis('{em}Including hair{/em} is what the measurement means')).toEqual([
      { text: 'Including hair', emphasis: true },
      { text: ' is what the measurement means', emphasis: false },
    ]);
  });

  it('handles emphasis at the very end of a value', () => {
    expect(parseEmphasis('the measurement runs to the crown, {em}including hair{/em}')).toEqual([
      { text: 'the measurement runs to the crown, ', emphasis: false },
      { text: 'including hair', emphasis: true },
    ]);
  });

  it('handles several pairs in one value', () => {
    expect(parseEmphasis('{em}chin{/em} to {em}crown{/em}, hair included')).toEqual([
      { text: 'chin', emphasis: true },
      { text: ' to ', emphasis: false },
      { text: 'crown', emphasis: true },
      { text: ', hair included', emphasis: false },
    ]);
  });

  it('leaves an unclosed opener as literal text', () => {
    // Degrade visibly: the marker shows up in the copy, which a reviewer catches,
    // rather than swallowing the rest of the sentence or blanking the paragraph.
    expect(parseEmphasis('measured {em}including hair, which is why')).toEqual([
      { text: 'measured {em}including hair, which is why', emphasis: false },
    ]);
  });

  it('leaves a stray closer as literal text', () => {
    expect(parseEmphasis('measured including hair{/em}, which is why')).toEqual([
      { text: 'measured including hair{/em}, which is why', emphasis: false },
    ]);
  });

  it('does not nest, and leaves the inner markers visible', () => {
    // An <em> inside an <em> says nothing, so the first closer wins and every
    // leftover marker stays in the text where a translator can see it.
    expect(parseEmphasis('a {em}b {em}c{/em} d{/em}')).toEqual([
      { text: 'a ', emphasis: false },
      { text: 'b {em}c', emphasis: true },
      { text: ' d{/em}', emphasis: false },
    ]);
  });

  it('carries a script tag through as inert text, never as structure', () => {
    const payload = '<script>alert(1)</script>';
    // The parser only ever produces text plus a boolean. There is no field a
    // caller could interpolate as HTML, so this is escaped at the render site.
    expect(parseEmphasis(`before ${payload} after`)).toEqual([
      { text: `before ${payload} after`, emphasis: false },
    ]);
    expect(parseEmphasis(`{em}${payload}{/em}`)).toEqual([{ text: payload, emphasis: true }]);
  });

  it('carries an event-handler attribute through as inert text', () => {
    const payload = '<img src=x onerror=alert(1)>';
    expect(parseEmphasis(payload)).toEqual([{ text: payload, emphasis: false }]);
    expect(parseEmphasis(`{em}${payload}{/em}`)).toEqual([{ text: payload, emphasis: true }]);
  });

  it('never leaks a well-formed marker into a chunk', () => {
    const chunks = parseEmphasis('the head {em}including hair{/em}, measured to the crown');
    for (const chunk of chunks) {
      expect(chunk.text).not.toContain('{em}');
      expect(chunk.text).not.toContain('{/em}');
    }
  });

  it('drops empty pairs rather than emitting empty elements', () => {
    expect(parseEmphasis('chin{em}{/em} to crown')).toEqual([
      { text: 'chin', emphasis: false },
      { text: ' to crown', emphasis: false },
    ]);
    expect(parseEmphasis('')).toEqual([]);
  });
});
