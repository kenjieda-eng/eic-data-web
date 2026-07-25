import { describe, expect, test } from "vitest";
import { getKnownStale, KNOWN_STALE, type KnownStaleKind } from "./known-stale";

// pipeline 側 check_staleness.py の KNOWN_STALE と一致すべき 6 系列。
// 片方だけ変えると「止まったデータを黙って見せない」の対が崩れるため、
// このテストが両者の対応（件数・種別）を固定する。
const EXPECTED: Record<string, KnownStaleKind> = {
  "eu-ets-emissions-country-gb": "structural",
  "eu-ets-allowances-allocated-country-gb": "structural",
  "eu-ets-emissions-country-li": "structural",
  "eu-ets-allowances-allocated-country-li": "structural",
  "jma-snow-max-kansai": "seasonal",
  "jma-snow-max-shikoku": "seasonal",
};

describe("known-stale マップ", () => {
  test("対象は 6 系列ちょうど（pipeline KNOWN_STALE と同一集合）", () => {
    expect(Object.keys(KNOWN_STALE).sort()).toEqual(
      Object.keys(EXPECTED).sort(),
    );
  });

  test("各系列の kind が期待どおりで、note が非空", () => {
    for (const [id, kind] of Object.entries(EXPECTED)) {
      const entry = KNOWN_STALE[id];
      expect(entry, `${id} が KNOWN_STALE に無い`).toBeDefined();
      expect(entry.kind, `${id} の kind`).toBe(kind);
      expect(entry.note.trim().length).toBeGreaterThan(10);
    }
  });

  test("getKnownStale は対象で注記を、非対象で null を返す", () => {
    expect(getKnownStale("eu-ets-emissions-country-gb")?.kind).toBe(
      "structural",
    );
    expect(getKnownStale("jma-snow-max-kansai")?.kind).toBe("seasonal");
    // 非対象の通常系列は注記なし（バナーが出てはいけない）。
    expect(getKnownStale("jepx-spot-tokyo")).toBeNull();
    expect(getKnownStale("does-not-exist")).toBeNull();
  });
});
