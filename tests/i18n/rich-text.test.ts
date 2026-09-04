import { describe, it, expect } from 'vitest';
import { parseEmphasis, parseLinks, type RichTextLink } from '@/i18n/rich-text';

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

/**
 * Links are the case emphasis deliberately does not cover: the text is
 * translatable and the destination is not. So these tests carry three jobs —
 * that a translator can move a link around a sentence, that two links in one
 * paragraph stay told apart, and that nothing a translator can type becomes
 * markup or changes where a link goes.
 */
describe('parseLinks', () => {
  // The two links the privacy page lends its advertising paragraph.
  const AD_CENTER: RichTextLink = {
    href: 'https://myadcenter.google.com/',
    rel: 'noopener',
    target: '_blank',
  };
  const ABOUT_ADS: RichTextLink = {
    href: 'https://optout.aboutads.info/',
    rel: 'noopener',
    target: '_blank',
  };
  const LINKS = [AD_CENTER, ABOUT_ADS];

  it('splits a single pair mid-sentence', () => {
    expect(
      parseLinks('review the ads you see at {a1}Google My Ad Center{/a1}, and', LINKS),
    ).toEqual([
      { text: 'review the ads you see at ', link: null },
      { text: 'Google My Ad Center', link: AD_CENTER },
      { text: ', and', link: null },
    ]);
  });

  it('keeps two links in one value apart', () => {
    expect(
      parseLinks('at {a1}Google My Ad Center{/a1}, or opt out at {a2}aboutads.info{/a2}.', LINKS),
    ).toEqual([
      { text: 'at ', link: null },
      { text: 'Google My Ad Center', link: AD_CENTER },
      { text: ', or opt out at ', link: null },
      { text: 'aboutads.info', link: ABOUT_ADS },
      { text: '.', link: null },
    ]);
  });

  it('lets a translator reorder the links without swapping their destinations', () => {
    // Word order moves under translation, and a sentence naming the opt-out
    // first is a perfectly good sentence.
    expect(parseLinks('{a2}aboutads.info{/a2}, or {a1}Google My Ad Center{/a1}', LINKS)).toEqual([
      { text: 'aboutads.info', link: ABOUT_ADS },
      { text: ', or ', link: null },
      { text: 'Google My Ad Center', link: AD_CENTER },
    ]);
  });

  it('returns a value with no marker as a single plain chunk', () => {
    const value = 'Because we hold no account and no photographs, there is nothing to show you.';
    expect(parseLinks(value, LINKS)).toEqual([{ text: value, link: null }]);
  });

  it('handles a link at the very start and at the very end', () => {
    expect(parseLinks('{a1}Google My Ad Center{/a1} lists the ads you see', LINKS)).toEqual([
      { text: 'Google My Ad Center', link: AD_CENTER },
      { text: ' lists the ads you see', link: null },
    ]);
    expect(parseLinks('the ads you see are listed at {a1}Google My Ad Center{/a1}', LINKS)).toEqual([
      { text: 'the ads you see are listed at ', link: null },
      { text: 'Google My Ad Center', link: AD_CENTER },
    ]);
  });

  it('leaves an unclosed opener as literal text', () => {
    const value = 'review the ads at {a1}Google My Ad Center, and opt out';
    expect(parseLinks(value, LINKS)).toEqual([{ text: value, link: null }]);
  });

  it('leaves a stray closer as literal text', () => {
    const value = 'review the ads at Google My Ad Center{/a1}, and opt out';
    expect(parseLinks(value, LINKS)).toEqual([{ text: value, link: null }]);
  });

  it('treats a pair closed by the wrong number as an unclosed opener', () => {
    // Not a silent guess at which link was meant: the markers stay visible.
    const value = 'review the ads at {a1}Google My Ad Center{/a2}, and opt out';
    expect(parseLinks(value, LINKS)).toEqual([{ text: value, link: null }]);
  });

  it('leaves a number with no link behind it as text, and reads on', () => {
    // One invented marker must not cost the paragraph the link it does have.
    expect(parseLinks('see {a5}nowhere{/a5} then {a1}Ad Center{/a1}', [AD_CENTER])).toEqual([
      { text: 'see {a5}nowhere{/a5} then ', link: null },
      { text: 'Ad Center', link: AD_CENTER },
    ]);
  });

  it('degrades every marker to text when the page lends no links at all', () => {
    const value = 'review the ads at {a1}Google My Ad Center{/a1}';
    expect(parseLinks(value, [])).toEqual([{ text: value, link: null }]);
  });

  it('links the same destination twice when a value uses one number twice', () => {
    expect(parseLinks('{a1}here{/a1} and {a1}here{/a1}', LINKS)).toEqual([
      { text: 'here', link: AD_CENTER },
      { text: ' and ', link: null },
      { text: 'here', link: AD_CENTER },
    ]);
  });

  it('does not nest, and leaves the inner markers visible', () => {
    // An <a> inside an <a> is not a thing, so the first closer wins.
    expect(parseLinks('a {a1}b {a1}c{/a1} d{/a1}', LINKS)).toEqual([
      { text: 'a ', link: null },
      { text: 'b {a1}c', link: AD_CENTER },
      { text: ' d{/a1}', link: null },
    ]);
  });

  it('drops empty pairs rather than emitting empty elements', () => {
    expect(parseLinks('opt out{a1}{/a1} of personalised ads', LINKS)).toEqual([
      { text: 'opt out', link: null },
      { text: ' of personalised ads', link: null },
    ]);
    expect(parseLinks('', LINKS)).toEqual([]);
  });

  it('never leaks a well-formed marker into a chunk', () => {
    const chunks = parseLinks('at {a1}Ad Center{/a1} or {a2}aboutads.info{/a2}', LINKS);
    for (const chunk of chunks) {
      expect(chunk.text).not.toContain('{a1}');
      expect(chunk.text).not.toContain('{/a1}');
      expect(chunk.text).not.toContain('{a2}');
      expect(chunk.text).not.toContain('{/a2}');
    }
  });

  it('carries a script tag through as inert text, never as structure', () => {
    const payload = '<script>alert(1)</script>';
    // The parser only ever produces text plus one of the page's own link objects.
    // There is no field a caller could interpolate as HTML, so this is escaped at
    // the render site.
    expect(parseLinks(`before ${payload} after`, LINKS)).toEqual([
      { text: `before ${payload} after`, link: null },
    ]);
    expect(parseLinks(`{a1}${payload}{/a1}`, LINKS)).toEqual([
      { text: payload, link: AD_CENTER },
    ]);
  });

  it('carries an event-handler attribute through as inert text', () => {
    const payload = '<img src=x onerror=alert(1)>';
    expect(parseLinks(`text ${payload}`, LINKS)).toEqual([
      { text: `text ${payload}`, link: null },
    ]);
    expect(parseLinks(`{a1}${payload}{/a1}`, LINKS)).toEqual([
      { text: payload, link: AD_CENTER },
    ]);
  });

  it("hands back the page's own link object, so copy cannot pick a destination", () => {
    // Identity, not equality: there is no path from a translated value to an
    // href. A bundle that writes a URL — or a `javascript:` one — writes text.
    const chunks = parseLinks(
      'href="javascript:alert(1)" {a1}javascript:alert(1){/a1} https://evil.example',
      LINKS,
    );

    const linked = chunks.filter((chunk) => chunk.link !== null);
    expect(linked).toHaveLength(1);
    expect(linked[0]?.link).toBe(AD_CENTER);
    expect(linked[0]?.text).toBe('javascript:alert(1)');

    for (const chunk of chunks) {
      if (chunk.link !== null) expect(LINKS).toContain(chunk.link);
    }
  });

  it('carries rel and target from the page untouched', () => {
    const [chunk] = parseLinks('{a1}Google My Ad Center{/a1}', LINKS);
    expect(chunk?.link?.href).toBe('https://myadcenter.google.com/');
    expect(chunk?.link?.rel).toBe('noopener');
    expect(chunk?.link?.target).toBe('_blank');
  });
});
