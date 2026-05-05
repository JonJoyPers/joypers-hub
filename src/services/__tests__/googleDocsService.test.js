/**
 * googleDocsService tests
 *
 * Critical path: the Store Manual screen renders sections parsed from a
 * Google Docs HTML export. Google's export format is regex-fragile —
 * if their HTML shifts (new wrapper classes, different bold encoding,
 * whitespace changes around headings), we silently get zero sections
 * and the manual goes blank. These tests pin the parser against
 * representative HTML fixtures so a regression shows up loud.
 *
 * The parser (parseDocIntoSections) is private, so we exercise it
 * through fetchManual() with a mocked global.fetch.
 */

import { fetchManual } from '../googleDocsService';

// ── Test fixtures ─────────────────────────────────────────

/**
 * Minimal Google Docs HTML export shape:
 * - <style> defines bold via font-weight:700 on a class (e.g. .c5)
 * - Headings are <p><span class="c5">N. Title</span></p>
 * - Body content appears between headings
 */
function buildGoogleDocsHtml({ boldClass = 'c5', sections = [] } = {}) {
  const style = `<style>.c1{color:#000}.${boldClass}{font-weight:700;color:#000}.c9{font-style:italic}</style>`;
  const body = sections
    .map(
      (s) =>
        `<p class="c1"><span class="${boldClass}">${s.num}. ${s.title}</span></p>` +
        s.body
    )
    .join('\n');
  return `<html><head>${style}</head><body class="c2">${body}</body></html>`;
}

function mockFetchHtml(html, { ok = true, status = 200 } = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(html),
  });
}

// ── Lifecycle ─────────────────────────────────────────────

beforeEach(() => {
  delete global.fetch;
});

// ── Tests ─────────────────────────────────────────────────

describe('googleDocsService.fetchManual', () => {
  describe('happy path', () => {
    test('parses a single section', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          {
            num: 1,
            title: 'Welcome',
            body: '<p class="c1"><span class="c1">Hello team.</span></p>',
          },
        ],
      });
      mockFetchHtml(html);

      const { sections, contentHash } = await fetchManual();

      expect(sections).toHaveLength(1);
      expect(sections[0]).toMatchObject({
        id: 'gd_s1',
        sectionNumber: 1,
        title: '1. Welcome',
      });
      expect(sections[0].body).toContain('Hello team.');
      expect(contentHash).toMatch(/^[0-9a-z]+$/);
    });

    test('parses multiple sections in order', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          { num: 1, title: 'Welcome', body: '<p class="c1"><span class="c1">A</span></p>' },
          { num: 2, title: 'Conduct', body: '<p class="c1"><span class="c1">B</span></p>' },
          { num: 3, title: 'Pay',     body: '<p class="c1"><span class="c1">C</span></p>' },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections.map((s) => s.sectionNumber)).toEqual([1, 2, 3]);
      expect(sections[1].title).toBe('2. Conduct');
      expect(sections[2].body).toContain('C');
    });

    test('does NOT split on sub-section numbers like "5.1"', async () => {
      // The regex requires a space after the first dot, so 5.1 stays
      // inside the parent section rather than starting a new one.
      const html = buildGoogleDocsHtml({
        sections: [
          {
            num: 5,
            title: 'Schedule',
            body:
              '<p class="c1"><span class="c5">5.1 Time off</span></p>' +
              '<p class="c1"><span class="c1">Details about time off.</span></p>',
          },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections).toHaveLength(1);
      expect(sections[0].sectionNumber).toBe(5);
      expect(sections[0].body).toContain('5.1 Time off');
    });

    test('strips class, id, and style attributes from output', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          {
            num: 1,
            title: 'Welcome',
            body: '<p class="c1" id="h.abc" style="margin:0"><span class="c9">italic</span></p>',
          },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections[0].body).not.toMatch(/class=/);
      expect(sections[0].body).not.toMatch(/id=/);
      expect(sections[0].body).not.toMatch(/style=/);
    });

    test('removes page-break <hr> markers', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          {
            num: 1,
            title: 'Welcome',
            body:
              '<p class="c1"><span class="c1">Top</span></p>' +
              '<hr style="page-break-before:always">' +
              '<p class="c1"><span class="c1">Bottom</span></p>',
          },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections[0].body).not.toMatch(/page-break/);
      expect(sections[0].body).toContain('Top');
      expect(sections[0].body).toContain('Bottom');
    });
  });

  describe('bold conversion', () => {
    test('class-based bold spans become <b> tags', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          {
            num: 1,
            title: 'Welcome',
            body: '<p class="c1"><span class="c5">Important</span> regular text</p>',
          },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections[0].body).toMatch(/<b>Important<\/b>/);
      expect(sections[0].body).toContain('regular text');
    });

    test('non-bold spans are unwrapped (content kept, span removed)', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          {
            num: 1,
            title: 'Welcome',
            body: '<p class="c1"><span class="c1">plain content</span></p>',
          },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections[0].body).toContain('plain content');
      expect(sections[0].body).not.toMatch(/<span/);
    });
  });

  describe('title entity decoding', () => {
    test('decodes common HTML entities in section titles', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          { num: 1, title: 'Joy &amp; Pay', body: '<p class="c1">x</p>' },
          { num: 2, title: 'Don&rsquo;t', body: '<p class="c1">y</p>' },
          { num: 3, title: 'A &ndash; B', body: '<p class="c1">z</p>' },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections[0].title).toBe('1. Joy & Pay');
      expect(sections[1].title).toBe('2. Don\u2019t');
      expect(sections[2].title).toBe('3. A \u2013 B');
    });

    test('decodes numeric character references', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          { num: 1, title: 'Caf&#233;', body: '<p class="c1">x</p>' },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections[0].title).toBe('1. Café');
    });
  });

  describe('content hashing', () => {
    test('same input produces same hash', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          { num: 1, title: 'Welcome', body: '<p class="c1">A</p>' },
        ],
      });

      mockFetchHtml(html);
      const a = await fetchManual();
      mockFetchHtml(html);
      const b = await fetchManual();

      expect(a.contentHash).toBe(b.contentHash);
      expect(a.sections[0].contentHash).toBe(b.sections[0].contentHash);
    });

    test('different content produces different hashes', async () => {
      mockFetchHtml(
        buildGoogleDocsHtml({
          sections: [{ num: 1, title: 'A', body: '<p class="c1">one</p>' }],
        })
      );
      const a = await fetchManual();

      mockFetchHtml(
        buildGoogleDocsHtml({
          sections: [{ num: 1, title: 'A', body: '<p class="c1">two</p>' }],
        })
      );
      const b = await fetchManual();

      expect(a.contentHash).not.toBe(b.contentHash);
      expect(a.sections[0].contentHash).not.toBe(b.sections[0].contentHash);
    });
  });

  describe('edge cases', () => {
    test('returns empty array when no headings match', async () => {
      const html =
        '<html><head><style>.c1{font-weight:700}</style></head>' +
        '<body><p class="c1">Just a paragraph, no numbered heading.</p></body></html>';
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections).toEqual([]);
    });

    test('returns empty array when <body> is missing', async () => {
      const html = '<html><head><style>.c1{font-weight:700}</style></head></html>';
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections).toEqual([]);
    });

    test('handles missing <style> block (no bold classes detected)', async () => {
      // Without a style block, no class is recognised as bold —
      // headings won't match the <b>...</b> shape, so we get zero sections.
      // This is the failure mode we want to *detect* if Google changes formats.
      const html =
        '<html><body>' +
        '<p><span class="c5">1. Welcome</span></p>' +
        '<p><span class="c1">body</span></p>' +
        '</body></html>';
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections).toEqual([]);
    });

    test('throws when fetch returns non-OK status', async () => {
      mockFetchHtml('forbidden', { ok: false, status: 403 });

      await expect(fetchManual()).rejects.toThrow(/403/);
    });

    test('strips trailing <hr> separator from section body', async () => {
      const html = buildGoogleDocsHtml({
        sections: [
          {
            num: 1,
            title: 'Welcome',
            body: '<p class="c1"><span class="c1">content</span></p><hr/>',
          },
          {
            num: 2,
            title: 'Next',
            body: '<p class="c1"><span class="c1">more</span></p>',
          },
        ],
      });
      mockFetchHtml(html);

      const { sections } = await fetchManual();

      expect(sections[0].body).not.toMatch(/<hr\s*\/?>\s*$/);
      expect(sections[0].body).toContain('content');
    });
  });
});
