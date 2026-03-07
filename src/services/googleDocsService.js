/**
 * googleDocsService — fetches and parses Joy-Per's Store Manual from Google Docs
 *
 * The doc must be shared as "Anyone with the link" (Viewer).
 * We export as HTML to preserve formatting (bold, lists, tables),
 * then parse sections by finding numbered heading paragraphs.
 */

const DOC_ID = "1n5CfvU0bcdQnVzos5nbwuAtcQb5JCWlZ";
const EXPORT_URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=html`;

/**
 * Simple hash function (djb2) for detecting content changes
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Fetch the Google Doc as HTML and parse into sections.
 * Returns { sections: [...], contentHash: string }
 */
export async function fetchManual() {
  const response = await fetch(EXPORT_URL, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Failed to fetch manual: ${response.status}`);
  }

  const html = await response.text();
  const contentHash = hashString(html);
  const sections = parseDocIntoSections(html);

  return { sections, contentHash };
}

/**
 * Parse the Google Docs HTML export into clean section objects.
 *
 * Strategy:
 * 1. Parse <style> to find bold CSS classes (font-weight:700)
 * 2. Extract <body> content
 * 3. Convert class-based bold spans → <b> tags, unwrap non-bold spans
 * 4. Strip class/id/style attributes, page-break hrs
 * 5. Split on <p><b>N. Title</b></p> headings (top-level only, not N.N)
 * 6. Return clean HTML body per section
 */
function parseDocIntoSections(html) {
  // 1. Parse CSS to find bold classes
  const boldClasses = new Set();
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const css = styleMatch[1];
    const classRegex = /\.(c\d+)\{[^}]*font-weight:\s*700/g;
    let m;
    while ((m = classRegex.exec(css)) !== null) {
      boldClasses.add(m[1]);
    }
  }

  // 2. Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return [];
  let body = bodyMatch[1];

  // 3. Convert class-based bold spans → <b>, unwrap non-bold spans
  body = body.replace(
    /<span[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/span>/g,
    (_, classes, content) => {
      const isBold = classes.split(/\s+/).some((c) => boldClasses.has(c));
      return isBold ? `<b>${content}</b>` : content;
    }
  );

  // Strip any remaining bare span tags (image wrappers, etc.)
  body = body.replace(/<\/?span[^>]*>/g, "");

  // 4. Strip class/id/style attributes; remove page-break hrs
  body = body.replace(/\s+(class|id)="[^"]*"/g, "");
  body = body.replace(/\s+style="[^"]*"/g, "");
  body = body.replace(/<hr[^>]*page-break[^>]*>/g, "");

  // 5. Find section headings: <p><b>N. Title</b></p>
  //    \d+\.\s+ ensures "5." matches but "5.1" does not (no space after first dot)
  const headingRegex = /<p>\s*<b>\s*(\d+)\.\s+([\s\S]*?)<\/b>\s*<\/p>/g;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(body)) !== null) {
    headings.push({
      index: match.index,
      endIndex: match.index + match[0].length,
      sectionNum: parseInt(match[1], 10),
      title: decodeEntities(match[2].trim()),
    });
  }

  if (headings.length === 0) return [];

  // 6. Build sections with body HTML between headings
  const sections = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const bodyStart = h.endIndex;
    const bodyEnd =
      i + 1 < headings.length ? headings[i + 1].index : body.length;
    let sectionBody = body.slice(bodyStart, bodyEnd).trim();

    // Remove trailing <hr> that separate main sections
    sectionBody = sectionBody.replace(/<hr\s*\/?>\s*$/, "").trim();

    sections.push({
      id: `gd_s${h.sectionNum}`,
      sectionNumber: h.sectionNum,
      title: `${h.sectionNum}. ${h.title}`,
      body: sectionBody,
      contentHash: hashString(sectionBody),
    });
  }

  return sections;
}

/**
 * Decode common HTML entities for section titles (display text).
 * Body HTML entities are handled by the render-html component.
 */
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10))
    );
}
