import { describe, expect, test } from "vitest";
import {
  buildUtterancesScriptAttrs,
  UTTERANCES_DEFAULTS,
} from "./UtterancesComments";

describe("Day 6: Utterances 連動コメント設定", () => {
  test("UTTERANCES_DEFAULTS: 本番リポジトリと設定値が正しい", () => {
    expect(UTTERANCES_DEFAULTS.repo).toBe("kenjieda-eng/eic-data-web");
    expect(UTTERANCES_DEFAULTS.issueTerm).toBe("pathname");
    expect(UTTERANCES_DEFAULTS.label).toBe("comment");
    expect(UTTERANCES_DEFAULTS.theme).toBe("github-light");
  });

  test("buildUtterancesScriptAttrs: 引数なしは全 default で構築", () => {
    const attrs = buildUtterancesScriptAttrs();
    expect(attrs.src).toBe("https://utteranc.es/client.js");
    expect(attrs.repo).toBe("kenjieda-eng/eic-data-web");
    expect(attrs["issue-term"]).toBe("pathname");
    expect(attrs.label).toBe("comment");
    expect(attrs.theme).toBe("github-light");
    expect(attrs.crossorigin).toBe("anonymous");
    expect(attrs.async).toBe("true");
  });

  test("buildUtterancesScriptAttrs: HTTPS で client.js を読み込む (TLS 必須)", () => {
    const attrs = buildUtterancesScriptAttrs();
    expect(attrs.src).toMatch(/^https:\/\//);
    expect(attrs.src).toContain("utteranc.es");
  });

  test("buildUtterancesScriptAttrs: repo 上書きで他属性は default 維持", () => {
    const attrs = buildUtterancesScriptAttrs({
      repo: "another-org/another-repo",
    });
    expect(attrs.repo).toBe("another-org/another-repo");
    expect(attrs["issue-term"]).toBe("pathname");
    expect(attrs.label).toBe("comment");
  });

  test("buildUtterancesScriptAttrs: theme 上書き (dark mode 対応想定)", () => {
    const attrs = buildUtterancesScriptAttrs({
      theme: "github-dark",
    });
    expect(attrs.theme).toBe("github-dark");
  });

  test("buildUtterancesScriptAttrs: issueTerm を url / title に切替可能", () => {
    expect(
      buildUtterancesScriptAttrs({ issueTerm: "url" })["issue-term"],
    ).toBe("url");
    expect(
      buildUtterancesScriptAttrs({ issueTerm: "title" })["issue-term"],
    ).toBe("title");
    expect(
      buildUtterancesScriptAttrs({ issueTerm: "og:title" })["issue-term"],
    ).toBe("og:title");
  });

  test("buildUtterancesScriptAttrs: label 上書き (別ラベル運用想定)", () => {
    const attrs = buildUtterancesScriptAttrs({
      label: "insight-comment",
    });
    expect(attrs.label).toBe("insight-comment");
  });

  test("buildUtterancesScriptAttrs: crossorigin と async は常に固定値", () => {
    const a1 = buildUtterancesScriptAttrs();
    const a2 = buildUtterancesScriptAttrs({ repo: "x/y", theme: "github-dark" });
    expect(a1.crossorigin).toBe("anonymous");
    expect(a2.crossorigin).toBe("anonymous");
    expect(a1.async).toBe("true");
    expect(a2.async).toBe("true");
  });

  test("buildUtterancesScriptAttrs: repo 形式は org/repo (Insight #42 と整合)", () => {
    const attrs = buildUtterancesScriptAttrs();
    expect(attrs.repo).toMatch(/^[^/]+\/[^/]+$/);
    expect(attrs.repo.split("/")).toHaveLength(2);
  });
});
