import { describe, expect, test } from "vitest";
import type { Indicator } from "./catalog";
import {
  bibFilename,
  CITE_GALLERY,
  EMPTY_CITE_FILTERS,
  filterIndicatorsForCite,
  licenseTypeOf,
  LICENSE_TYPE_LABELS,
  SITE_CITATION,
} from "./cite-helpers";
import { generateCitation } from "./citation-formatter";

const ind = (over: Partial<Indicator>): Indicator => ({
  id: "jepx-spot-tokyo",
  name: "JEPX 東京スポット",
  domain: "power",
  frequency: "daily",
  unit: "JPY/kWh",
  source_name: "JEPX",
  source_url: "https://www.jepx.jp/",
  license: "CC-BY-4.0",
  observation_cutoff: "2026-05-01",
  updated_at: "2026-05-01T00:00:00Z",
  ...over,
});

const SAMPLE: Indicator[] = [
  ind({}),
  ind({
    id: "fuel-lng-cif",
    name: "LNG CIF (Japan)",
    domain: "fuel",
    frequency: "monthly",
    license: "CC-BY-4.0",
  }),
  ind({
    id: "boj-fm08-usd-jpy",
    name: "USD/JPY 月中平均 (BOJ FM08)",
    domain: "finance",
    frequency: "monthly",
    license: "日本銀行公表条件",
  }),
  ind({
    id: "jma-temp-tokyo",
    name: "東京日平均気温",
    domain: "weather",
    frequency: "daily",
    license: "気象庁ホームページ利用規約",
  }),
];

describe("/cite: cite-helpers", () => {
  test("bibFilename: bibtex 形式は .bib 拡張子", () => {
    expect(bibFilename("jepx-spot-tokyo", "bibtex")).toBe(
      "eic-data-jepx-spot-tokyo.bib",
    );
    expect(bibFilename("eic-data-platform", "bibtex")).toBe(
      "eic-data-eic-data-platform.bib",
    );
  });

  test("bibFilename: chicago / apa 形式は .txt 拡張子", () => {
    expect(bibFilename("us-cpi-vs-fx", "chicago")).toBe(
      "eic-data-us-cpi-vs-fx.txt",
    );
    expect(bibFilename("us-cpi-vs-fx", "apa")).toBe(
      "eic-data-us-cpi-vs-fx.txt",
    );
  });

  test("licenseTypeOf: SPDX と独自の二分類", () => {
    expect(licenseTypeOf("CC-BY-4.0")).toBe("spdx");
    expect(licenseTypeOf("CC0")).toBe("spdx");
    expect(licenseTypeOf("MIT")).toBe("spdx");
    expect(licenseTypeOf("日本銀行公表条件")).toBe("custom");
    expect(licenseTypeOf("気象庁ホームページ利用規約")).toBe("custom");
    expect(licenseTypeOf(undefined)).toBe("custom");
    expect(LICENSE_TYPE_LABELS.spdx).toContain("SPDX");
    expect(LICENSE_TYPE_LABELS.custom).toContain("独自");
  });

  test("filterIndicatorsForCite: 絞り込みなしは全件", () => {
    expect(filterIndicatorsForCite(SAMPLE, EMPTY_CITE_FILTERS)).toHaveLength(4);
  });

  test("filterIndicatorsForCite: domain で絞り込み", () => {
    const r = filterIndicatorsForCite(SAMPLE, {
      ...EMPTY_CITE_FILTERS,
      domain: "fuel",
    });
    expect(r).toHaveLength(1);
    expect(r[0]?.id).toBe("fuel-lng-cif");
  });

  test("filterIndicatorsForCite: frequency で絞り込み", () => {
    const r = filterIndicatorsForCite(SAMPLE, {
      ...EMPTY_CITE_FILTERS,
      frequency: "daily",
    });
    expect(r.map((x) => x.id).sort()).toEqual([
      "jepx-spot-tokyo",
      "jma-temp-tokyo",
    ]);
  });

  test("filterIndicatorsForCite: licenseType=custom は SPDX を除外", () => {
    const r = filterIndicatorsForCite(SAMPLE, {
      ...EMPTY_CITE_FILTERS,
      licenseType: "custom",
    });
    expect(r.map((x) => x.id).sort()).toEqual([
      "boj-fm08-usd-jpy",
      "jma-temp-tokyo",
    ]);
  });

  test("filterIndicatorsForCite: query は id / name 部分一致 (大文字小文字無視)", () => {
    expect(
      filterIndicatorsForCite(SAMPLE, {
        ...EMPTY_CITE_FILTERS,
        query: "JEPX",
      }),
    ).toHaveLength(1);
    expect(
      filterIndicatorsForCite(SAMPLE, {
        ...EMPTY_CITE_FILTERS,
        query: "東京",
      }).map((x) => x.id).sort(),
    ).toEqual(["jepx-spot-tokyo", "jma-temp-tokyo"]);
    expect(
      filterIndicatorsForCite(SAMPLE, {
        ...EMPTY_CITE_FILTERS,
        query: "存在しないキーワード",
      }),
    ).toHaveLength(0);
  });

  test("filterIndicatorsForCite: 複数フィルタは AND 合成", () => {
    const r = filterIndicatorsForCite(SAMPLE, {
      query: "tokyo",
      domain: "weather",
      frequency: "daily",
      licenseType: "custom",
    });
    expect(r).toHaveLength(1);
    expect(r[0]?.id).toBe("jma-temp-tokyo");
  });

  test("SITE_CITATION: モード C 全体引用が generateCitation で生成可能", () => {
    const bib = generateCitation(SITE_CITATION, "bibtex");
    expect(bib).toContain("@misc{eic-data-eic-data-platform,");
    expect(bib).toContain(
      "EIC Data — 日本のエネルギーと金融の引用インフラ",
    );
    expect(bib).toContain("publisher = {EIC Data}");
  });

  test("CITE_GALLERY: 3 件、format 三形式すべて含む、各 sample に EIC Data が出る", () => {
    expect(CITE_GALLERY).toHaveLength(3);
    const formats = CITE_GALLERY.map((g) => g.format).sort();
    expect(formats).toEqual(["apa", "bibtex", "chicago"]);
    for (const g of CITE_GALLERY) {
      expect(g.sample).toContain("EIC Data");
      expect(g.scene.length).toBeGreaterThan(0);
      expect(g.note.length).toBeGreaterThan(0);
    }
  });
});
