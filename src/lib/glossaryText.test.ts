import { describe, expect, it } from "vitest";
import { glossaryTextToPlain, parseGlossaryText } from "./glossaryText";

const NAMES: Record<string, string> = {
  eua: "EUA",
  "gx-ets": "GX-ETS",
};

describe("parseGlossaryText", () => {
  it("既知 slug を link トークンに解決し、前後テキストを保持する", () => {
    const tokens = parseGlossaryText("EU ETS の [[eua]] が代表。", NAMES);
    expect(tokens).toEqual([
      { type: "text", value: "EU ETS の " },
      { type: "link", slug: "eua", label: "EUA" },
      { type: "text", value: " が代表。" },
    ]);
  });

  it("未知 slug はプレーン文字へ graceful にフォールバックする（壊さない）", () => {
    const tokens = parseGlossaryText("前 [[unknown-x]] 後", NAMES);
    expect(tokens).toEqual([
      { type: "text", value: "前 " },
      { type: "text", value: "unknown-x" },
      { type: "text", value: " 後" },
    ]);
  });

  it("複数リンクおよび記法なしテキストを正しく扱う", () => {
    expect(parseGlossaryText("[[eua]] と [[gx-ets]]", NAMES)).toEqual([
      { type: "link", slug: "eua", label: "EUA" },
      { type: "text", value: " と " },
      { type: "link", slug: "gx-ets", label: "GX-ETS" },
    ]);
    expect(parseGlossaryText("リンクなしの説明文", NAMES)).toEqual([
      { type: "text", value: "リンクなしの説明文" },
    ]);
  });

  it("Map と Record の両方の解決表を受け付ける", () => {
    const map = new Map([["eua", "EUA"]]);
    expect(parseGlossaryText("[[eua]]", map)).toEqual([
      { type: "link", slug: "eua", label: "EUA" },
    ]);
  });
});

describe("glossaryTextToPlain", () => {
  it("既知は用語名・未知は slug でプレーン化する（meta / JSON-LD 用）", () => {
    expect(
      glossaryTextToPlain("EU ETS の [[eua]]、未知 [[zzz]] と密接", NAMES),
    ).toBe("EU ETS の EUA、未知 zzz と密接");
  });
});
