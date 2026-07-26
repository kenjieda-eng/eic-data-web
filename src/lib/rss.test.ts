import { describe, expect, test } from "vitest";
import { INSIGHTS } from "./insights";
import {
  buildRssXml,
  escapeXml,
  RSS_ITEM_LIMIT,
  toRfc822Jst,
  type RssSource,
} from "./rss";

// 連番の updated を持つダミー Insight を n 件つくる（新しいほど末尾）。
function makeInsights(n: number): RssSource[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `slug-${i}`,
    title: `タイトル ${i}`,
    lede: `説明 ${i}`,
    // 2026-01-01 から 1 日ずつ進める（n <= 28 の範囲で使う）。
    updated: `2026-01-${String(i + 1).padStart(2, "0")}`,
  }));
}

function itemTitles(xml: string): string[] {
  return [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g)].map(
    (m) => m[1],
  );
}

describe("escapeXml", () => {
  test("XML 特殊文字 5 種をすべて実体参照へ置換する", () => {
    expect(escapeXml(`& < > " '`)).toBe(
      "&amp; &lt; &gt; &quot; &apos;",
    );
  });

  test("& を二重エスケープしない（先に & を処理している）", () => {
    expect(escapeXml("A & B < C")).toBe("A &amp; B &lt; C");
    expect(escapeXml("&amp;")).toBe("&amp;amp;");
  });
});

describe("buildRssXml — エスケープ", () => {
  test("title / description の & < > \" ' がエスケープされ生の記号が残らない", () => {
    const xml = buildRssXml([
      {
        slug: "escape-me",
        title: `LNG & 電力 <速報> "引用" 'テスト'`,
        lede: `t<2 かつ a>b、AT&T の「"引用"」と 'クオート'`,
        updated: "2026-05-02",
      },
    ]);

    expect(xml).toContain(
      "<title>LNG &amp; 電力 &lt;速報&gt; &quot;引用&quot; &apos;テスト&apos;</title>",
    );
    expect(xml).toContain(
      "<description>t&lt;2 かつ a&gt;b、AT&amp;T の「&quot;引用&quot;」と &apos;クオート&apos;</description>",
    );

    // item の中身に生の & / < / > が残っていないこと（タグ自体は除く）。
    const itemBody = xml.slice(xml.indexOf("<item>"), xml.indexOf("</item>"));
    const textOnly = itemBody.replace(/<[^>]*>/g, "");
    expect(textOnly).not.toMatch(/&(?!(amp|lt|gt|quot|apos);)/);
    expect(textOnly).not.toMatch(/[<>]/);
  });

  test("実データ（INSIGHTS）にも未エスケープの & / < / > が出力されない", () => {
    const xml = buildRssXml(INSIGHTS);
    const text = xml.replace(/<[^>]*>/g, "");
    expect(text).not.toMatch(/&(?!(amp|lt|gt|quot|apos);)/);
    expect(text).not.toMatch(/[<>]/);
  });
});

describe("buildRssXml — 件数上限", () => {
  test(`${RSS_ITEM_LIMIT} 件を超える入力でも item は ${RSS_ITEM_LIMIT} 件で打ち切る`, () => {
    const xml = buildRssXml(makeInsights(28));
    expect(itemTitles(xml)).toHaveLength(RSS_ITEM_LIMIT);
  });

  test("上限未満の入力は全件そのまま出力する", () => {
    const xml = buildRssXml(makeInsights(3));
    expect(itemTitles(xml)).toHaveLength(3);
  });

  test("実データ（105 本想定）でも上限どおり 20 件", () => {
    expect(INSIGHTS.length).toBeGreaterThan(RSS_ITEM_LIMIT);
    expect(itemTitles(buildRssXml(INSIGHTS))).toHaveLength(RSS_ITEM_LIMIT);
  });
});

describe("buildRssXml — updated 降順", () => {
  test("入力順に関係なく updated の新しい順に並ぶ", () => {
    // 入力は古い順。出力は新しい順（slug-27 → slug-8）になるはず。
    const xml = buildRssXml(makeInsights(28));
    const titles = itemTitles(xml);
    expect(titles[0]).toBe("タイトル 27");
    expect(titles[titles.length - 1]).toBe("タイトル 8");
  });

  test("出力された pubDate が単調非増加（新しい順）である", () => {
    const xml = buildRssXml(INSIGHTS);
    const pubDates = [...xml.matchAll(/<pubDate>(.*?)<\/pubDate>/g)].map((m) =>
      new Date(m[1]).getTime(),
    );
    expect(pubDates).toHaveLength(RSS_ITEM_LIMIT);
    for (const t of pubDates) expect(Number.isNaN(t)).toBe(false);
    for (let i = 1; i < pubDates.length; i += 1) {
      expect(pubDates[i]).toBeLessThanOrEqual(pubDates[i - 1]);
    }
  });
});

describe("toRfc822Jst", () => {
  test("日付のみの updated を JST 0 時の RFC 822 に変換する", () => {
    // 2026-05-02 は土曜日。
    expect(toRfc822Jst("2026-05-02")).toBe("Sat, 02 May 2026 00:00:00 +0900");
    expect(toRfc822Jst("2026-01-01")).toBe("Thu, 01 Jan 2026 00:00:00 +0900");
  });

  test("不正な日付は空文字を返す（例外にしない）", () => {
    expect(toRfc822Jst("not-a-date")).toBe("");
  });
});
