import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

/**
 * HtmlBody — lightweight HTML renderer for the store manual.
 *
 * Handles the limited set of tags produced by googleDocsService:
 *   <p>, <b>, <ul>, <ol>, <li>, <table>, <tr>, <td>, <hr>, <a>
 *
 * No external dependencies — works with Fabric / new architecture.
 */
export default function HtmlBody({ html }) {
  if (!html) return null;
  const blocks = parseBlocks(html);
  return (
    <View>
      {blocks.map((block, i) => renderBlock(block, i))}
    </View>
  );
}

// ── Block parser ──────────────────────────────────────

function parseBlocks(html) {
  const blocks = [];
  // Normalize: collapse whitespace runs, trim
  let src = html.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim();

  while (src.length > 0) {
    // <hr>
    const hrMatch = src.match(/^<hr\s*\/?>/i);
    if (hrMatch) {
      blocks.push({ type: "hr" });
      src = src.slice(hrMatch[0].length).trim();
      continue;
    }

    // <ul>...</ul>
    const ulMatch = src.match(/^<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (ulMatch) {
      blocks.push({ type: "ul", items: parseListItems(ulMatch[1]) });
      src = src.slice(ulMatch[0].length).trim();
      continue;
    }

    // <ol>...</ol>
    const olMatch = src.match(/^<ol[^>]*>([\s\S]*?)<\/ol>/i);
    if (olMatch) {
      blocks.push({ type: "ol", items: parseListItems(olMatch[1]) });
      src = src.slice(olMatch[0].length).trim();
      continue;
    }

    // <table>...</table>
    const tableMatch = src.match(/^<table[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      blocks.push({ type: "table", rows: parseTableRows(tableMatch[1]) });
      src = src.slice(tableMatch[0].length).trim();
      continue;
    }

    // <p>...</p>
    const pMatch = src.match(/^<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch) {
      blocks.push({ type: "p", content: pMatch[1].trim() });
      src = src.slice(pMatch[0].length).trim();
      continue;
    }

    // Bare text (no wrapping tag) — consume until next block tag
    const nextTag = src.search(/<(p|ul|ol|table|hr)[\s>/]/i);
    if (nextTag > 0) {
      const text = src.slice(0, nextTag).trim();
      if (text) blocks.push({ type: "p", content: text });
      src = src.slice(nextTag).trim();
    } else {
      // Remaining text
      const text = src.replace(/<[^>]+>/g, "").trim();
      if (text) blocks.push({ type: "p", content: src.trim() });
      break;
    }
  }

  return blocks;
}

function parseListItems(html) {
  const items = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liRegex.exec(html)) !== null) {
    items.push(m[1].trim());
  }
  return items;
}

function parseTableRows(html) {
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRegex.exec(html)) !== null) {
    const cells = [];
    const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let c;
    while ((c = tdRegex.exec(m[1])) !== null) {
      cells.push(c[1].trim());
    }
    rows.push(cells);
  }
  return rows;
}

// ── Renderers ─────────────────────────────────────────

function renderBlock(block, key) {
  switch (block.type) {
    case "hr":
      return <View key={key} style={s.hr} />;

    case "p":
      return (
        <Text key={key} style={s.paragraph} selectable>
          {renderInline(block.content)}
        </Text>
      );

    case "ul":
      return (
        <View key={key} style={s.list}>
          {block.items.map((item, i) => (
            <View key={i} style={s.listItem}>
              <Text style={s.bullet}>{"\u2022"}</Text>
              <Text style={s.listText} selectable>
                {renderInline(item)}
              </Text>
            </View>
          ))}
        </View>
      );

    case "ol":
      return (
        <View key={key} style={s.list}>
          {block.items.map((item, i) => (
            <View key={i} style={s.listItem}>
              <Text style={s.bullet}>{i + 1}.</Text>
              <Text style={s.listText} selectable>
                {renderInline(item)}
              </Text>
            </View>
          ))}
        </View>
      );

    case "table":
      return (
        <View key={key} style={s.table}>
          {block.rows.map((cells, ri) => (
            <View key={ri} style={s.tableRow}>
              {cells.map((cell, ci) => (
                <View
                  key={ci}
                  style={[s.tableCell, ri === 0 && s.tableHeaderCell]}
                >
                  <Text
                    style={[s.cellText, ri === 0 && s.headerCellText]}
                    selectable
                  >
                    {renderInline(cell)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
}

/**
 * Render inline formatting: <b>, <a>, and decoded entities.
 * Returns an array of Text elements / strings.
 */
function renderInline(html) {
  if (!html) return null;

  // Split on <b>...</b> and <a>...</a> tags
  const parts = html.split(/(<b>[\s\S]*?<\/b>|<a[^>]*>[\s\S]*?<\/a>)/gi);

  return parts.map((part, i) => {
    // Bold
    if (/^<b>/i.test(part)) {
      const text = stripTags(part.replace(/<\/?b>/gi, ""));
      return (
        <Text key={i} style={s.bold}>
          {decode(text)}
        </Text>
      );
    }

    // Link (render as bold teal text — no Linking needed for a manual)
    if (/^<a/i.test(part)) {
      const text = stripTags(part.replace(/<\/?a[^>]*>/gi, ""));
      return (
        <Text key={i} style={s.link}>
          {decode(text)}
        </Text>
      );
    }

    // Plain text — strip any remaining tags
    const text = stripTags(part);
    return text ? decode(text) : null;
  });
}

function stripTags(str) {
  return str.replace(/<[^>]+>/g, "");
}

function decode(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10))
    );
}

// ── Styles ────────────────────────────────────────────

const s = StyleSheet.create({
  paragraph: {
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: "700",
    color: COLORS.cream,
  },
  link: {
    fontWeight: "600",
    color: COLORS.teal,
  },
  hr: {
    height: 1,
    backgroundColor: COLORS.charcoalLight,
    marginVertical: 12,
  },
  list: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 13,
    color: COLORS.creamMuted,
    width: 20,
    lineHeight: 20,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    borderWidth: 0.5,
    borderColor: COLORS.charcoalLight,
  },
  tableHeaderCell: {
    backgroundColor: COLORS.charcoalLight,
  },
  cellText: {
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 17,
  },
  headerCellText: {
    fontWeight: "700",
    color: COLORS.cream,
  },
});
