import { describe, expect, test } from "vitest";
import {
  CITATION_FORMAT_LABELS,
  generateApa,
  generateBibtex,
  generateChicago,
  generateCitation,
} from "./citation-formatter";

const FIXED_DATE = "2026-05-11";
const indicatorInput = {
  slug: "jepx-spot-tokyo",
  title: "JEPX 東京スポット価格",
  kind: "indicator" as const,
  sourceName: "JEPX スポット価格（日次サマリ）",
  sourceUrl: "https://www.jepx.jp/electricpower/market-data/spot/",
  license: "CC BY 4.0",
  year: 2026,
  accessedAt: FIXED_DATE,
};

const insightInput = {
  slug: "us-cpi-vs-fx",
  title: "米 CPI × USD/JPY",
  kind: "insight" as const,
  year: 2026,
  accessedAt: FIXED_DATE,
};

describe("Phase C Day 3: citation-formatter", () => {
  test("BibTeX: indicator は key + title + author 正しく出力", () => {
    const out = generateBibtex(indicatorInput);
    expect(out).toContain("@misc{eic-data-jepx-spot-tokyo,");
    expect(out).toContain(
      "title = {JEPX 東京スポット価格 (jepx-spot-tokyo)},",
    );
    expect(out).toContain(
      "author = {EIC Data (一般社団法人エネルギー情報センター)},",
    );
    expect(out).toContain("year = {2026},");
    expect(out).toContain(
      "url = {https://data.eic-jp.org/catalog/jepx-spot-tokyo},",
    );
    expect(out).toContain("Accessed: 2026-05-11");
    expect(out).toContain("License: CC BY 4.0");
    expect(out).toContain(
      "Primary source: JEPX スポット価格（日次サマリ）",
    );
    expect(out).toContain("publisher = {EIC Data}");
  });

  test("Chicago 17: indicator は author. year. title. accessed. url. 構造", () => {
    const out = generateChicago(indicatorInput);
    expect(out).toMatch(
      /^EIC Data \(一般社団法人エネルギー情報センター\)\. 2026\. "JEPX 東京スポット価格 \(jepx-spot-tokyo\)\."/,
    );
    expect(out).toContain("Accessed May 11, 2026.");
    expect(out).toContain("https://data.eic-jp.org/catalog/jepx-spot-tokyo");
    expect(out).toContain("Primary source: JEPX スポット価格（日次サマリ）.");
    expect(out).toContain("License: CC BY 4.0.");
  });

  test("APA 7: indicator は [Data set] タグ付き + Retrieved 句", () => {
    const out = generateApa(indicatorInput);
    expect(out).toMatch(
      /^EIC Data \(一般社団法人エネルギー情報センター\)\. \(2026\)\. JEPX 東京スポット価格 \(jepx-spot-tokyo\) \[Data set\]\./,
    );
    expect(out).toContain("Retrieved May 11, 2026, from");
    expect(out).toContain("https://data.eic-jp.org/catalog/jepx-spot-tokyo");
    expect(out).toContain("License: CC BY 4.0.");
  });

  test("APA 7: insight は [Insight] タグ付き + /insight/ URL", () => {
    const out = generateApa(insightInput);
    expect(out).toContain("[Insight]");
    expect(out).toContain("https://data.eic-jp.org/insight/us-cpi-vs-fx");
  });

  test("generateCitation: format でディスパッチ", () => {
    const bib = generateCitation(indicatorInput, "bibtex");
    const chi = generateCitation(indicatorInput, "chicago");
    const apa = generateCitation(indicatorInput, "apa");
    expect(bib).toContain("@misc{");
    expect(chi).toContain("Accessed");
    expect(apa).toContain("Retrieved");
  });

  test("accessedAt 省略時は今日の YYYY-MM-DD が自動補完", () => {
    const today = new Date().toISOString().slice(0, 10);
    const out = generateBibtex({ ...indicatorInput, accessedAt: undefined });
    expect(out).toContain(`Accessed: ${today}`);
  });

  test("year 省略時は現在年が自動補完", () => {
    const thisYear = new Date().getUTCFullYear();
    const out = generateBibtex({ ...indicatorInput, year: undefined });
    expect(out).toContain(`year = {${thisYear}},`);
  });

  test("license 省略時は CC BY 4.0 が既定 (リク監修ポイント)", () => {
    const out = generateBibtex({ ...indicatorInput, license: undefined });
    expect(out).toContain("License: CC BY 4.0");
  });

  test("sourceName 不在 (Insight) は Primary source 句を出さない", () => {
    const out = generateChicago(insightInput);
    expect(out).not.toContain("Primary source:");
    expect(out).toContain("License: CC BY 4.0.");
  });

  test("CITATION_FORMAT_LABELS: 3 ラベル定義", () => {
    expect(CITATION_FORMAT_LABELS.bibtex).toBe("BibTeX");
    expect(CITATION_FORMAT_LABELS.chicago).toBe("Chicago 17");
    expect(CITATION_FORMAT_LABELS.apa).toBe("APA 7");
  });
});
