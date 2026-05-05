/**
 * HtmlBody tests
 *
 * HtmlBody is the renderer for the in-app store manual — it consumes HTML
 * produced by googleDocsService and turns it into native <View>/<Text>
 * trees. It's a regex-based parser, which means every supported tag is a
 * separate fragile branch:
 *
 *   <p>, <b>, <a>, <ul>, <ol>, <li>, <table>, <tr>, <td>, <th>, <hr>
 *   + HTML entities (&amp; &rsquo; &ndash; &#nnn; etc)
 *
 * If Google Docs ever changes its export markup or someone "improves" a
 * regex, the manual silently renders garbage. These tests pin the
 * happy paths and the entity decoder so format drift breaks loud here.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HtmlBody from '../HtmlBody';

describe('HtmlBody — empty / null', () => {
  test('returns null when html prop is missing', () => {
    const { toJSON } = render(<HtmlBody />);
    expect(toJSON()).toBeNull();
  });

  test('returns null when html prop is empty string', () => {
    const { toJSON } = render(<HtmlBody html="" />);
    expect(toJSON()).toBeNull();
  });
});

describe('HtmlBody — paragraphs', () => {
  test('renders a single <p> with its text content', () => {
    render(<HtmlBody html="<p>Hello world</p>" />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  test('renders multiple <p> blocks in order', () => {
    render(<HtmlBody html="<p>First</p><p>Second</p><p>Third</p>" />);
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.getByText('Third')).toBeTruthy();
  });

  test('treats bare text (no wrapping tag) as a paragraph', () => {
    render(<HtmlBody html="Just some text" />);
    expect(screen.getByText('Just some text')).toBeTruthy();
  });
});

describe('HtmlBody — inline bold and links', () => {
  test('renders <b> as a bold span inside the paragraph', () => {
    render(<HtmlBody html="<p>This is <b>important</b> text</p>" />);
    // Bold span and surrounding text both appear
    expect(screen.getByText('important')).toBeTruthy();
    expect(screen.getByText(/This is/)).toBeTruthy();
    expect(screen.getByText(/text/)).toBeTruthy();
  });

  test('renders <a> as a styled span (no Linking dependency)', () => {
    render(
      <HtmlBody html='<p>Visit <a href="https://example.com">our site</a> today</p>' />
    );
    expect(screen.getByText('our site')).toBeTruthy();
    expect(screen.getByText(/Visit/)).toBeTruthy();
    expect(screen.getByText(/today/)).toBeTruthy();
  });
});

describe('HtmlBody — lists', () => {
  test('<ul> renders each <li> with a bullet', () => {
    render(
      <HtmlBody html="<ul><li>Apples</li><li>Oranges</li><li>Pears</li></ul>" />
    );
    expect(screen.getByText('Apples')).toBeTruthy();
    expect(screen.getByText('Oranges')).toBeTruthy();
    expect(screen.getByText('Pears')).toBeTruthy();
    // Bullet character (U+2022) appears once per item
    expect(screen.getAllByText('\u2022').length).toBe(3);
  });

  test('<ol> renders each <li> with a 1-based number', () => {
    render(
      <HtmlBody html="<ol><li>Open till</li><li>Count drawer</li><li>Close till</li></ol>" />
    );
    expect(screen.getByText('Open till')).toBeTruthy();
    expect(screen.getByText('Count drawer')).toBeTruthy();
    expect(screen.getByText('Close till')).toBeTruthy();
    // Numeric labels
    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('2.')).toBeTruthy();
    expect(screen.getByText('3.')).toBeTruthy();
  });

  test('list items can contain inline <b> formatting', () => {
    render(<HtmlBody html="<ul><li>Use <b>two hands</b> always</li></ul>" />);
    expect(screen.getByText('two hands')).toBeTruthy();
  });
});

describe('HtmlBody — tables', () => {
  test('<table> renders header row + data rows with all cells', () => {
    const html =
      '<table>' +
      '<tr><th>Day</th><th>Hours</th></tr>' +
      '<tr><td>Mon</td><td>9-5</td></tr>' +
      '<tr><td>Tue</td><td>9-9</td></tr>' +
      '</table>';
    render(<HtmlBody html={html} />);
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Hours')).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('9-5')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
    expect(screen.getByText('9-9')).toBeTruthy();
  });

  test('table cells can contain inline formatting', () => {
    const html =
      '<table><tr><td>Status</td><td><b>OPEN</b></td></tr></table>';
    render(<HtmlBody html={html} />);
    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByText('OPEN')).toBeTruthy();
  });
});

describe('HtmlBody — horizontal rule', () => {
  test('<hr> renders without crashing and does not consume sibling content', () => {
    render(<HtmlBody html="<p>Above</p><hr><p>Below</p>" />);
    expect(screen.getByText('Above')).toBeTruthy();
    expect(screen.getByText('Below')).toBeTruthy();
  });

  test('self-closing <hr/> is also recognised', () => {
    render(<HtmlBody html="<p>Above</p><hr/><p>Below</p>" />);
    expect(screen.getByText('Above')).toBeTruthy();
    expect(screen.getByText('Below')).toBeTruthy();
  });
});

describe('HtmlBody — HTML entity decoding', () => {
  test('decodes named entities (&amp; &lt; &gt; &nbsp;)', () => {
    render(<HtmlBody html="<p>Tom &amp; Jerry &lt;3</p>" />);
    expect(screen.getByText('Tom & Jerry <3')).toBeTruthy();
  });

  test('decodes smart quote and dash entities', () => {
    render(
      <HtmlBody html="<p>It&rsquo;s a long&ndash;dash &mdash; ok?</p>" />
    );
    expect(screen.getByText('It\u2019s a long\u2013dash \u2014 ok?')).toBeTruthy();
  });

  test('decodes &ldquo; / &rdquo; smart quotes', () => {
    render(<HtmlBody html="<p>&ldquo;hello&rdquo;</p>" />);
    expect(screen.getByText('\u201Chello\u201D')).toBeTruthy();
  });

  test('decodes &hellip; ellipsis', () => {
    render(<HtmlBody html="<p>wait&hellip;</p>" />);
    expect(screen.getByText('wait\u2026')).toBeTruthy();
  });

  test('decodes numeric character references (&#nnn;)', () => {
    // &#9733; = ★ (BLACK STAR)
    render(<HtmlBody html="<p>Rating: &#9733;&#9733;&#9733;</p>" />);
    expect(screen.getByText('Rating: \u2605\u2605\u2605')).toBeTruthy();
  });
});

describe('HtmlBody — whitespace normalisation', () => {
  test('collapses runs of whitespace and newlines', () => {
    const html = '<p>Hello   \n\n   world</p>';
    render(<HtmlBody html={html} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });
});

describe('HtmlBody — mixed document', () => {
  test('renders a realistic Google-Docs-style export end to end', () => {
    const html = `
      <p>Welcome to <b>Joy-Per's</b></p>
      <hr>
      <p>Opening procedure:</p>
      <ol>
        <li>Unlock the front door</li>
        <li>Disarm the alarm</li>
      </ol>
      <p>Hours:</p>
      <table>
        <tr><th>Day</th><th>Open</th></tr>
        <tr><td>Mon</td><td>9am</td></tr>
      </table>
    `;
    render(<HtmlBody html={html} />);

    expect(screen.getByText("Joy-Per's")).toBeTruthy();
    expect(screen.getByText('Opening procedure:')).toBeTruthy();
    expect(screen.getByText('Unlock the front door')).toBeTruthy();
    expect(screen.getByText('Disarm the alarm')).toBeTruthy();
    expect(screen.getByText('Hours:')).toBeTruthy();
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('9am')).toBeTruthy();
  });
});
