import { afterEach, describe, expect, test, vi } from "vitest";
import {
  adaptRemoteSummary,
  fetchArchiveIndex,
  fetchLatestSummary,
  mapRemoteEditor,
  type RemoteTodaySummary,
} from "./morning-summary";

/** pipeline today-v1 の実データ抜粋 (latest.json 2026-07-07 相当) */
const REMOTE_FIXTURE: RemoteTodaySummary = {
  schema: "today-v1",
  date: "2026-07-07",
  weekday: "火",
  weekend: false,
  generatedAt: "2026-07-07T09:52:58+09:00",
  lines: [
    {
      indicatorId: "jepx-spot-tokyo",
      label: "JEPX 東京",
      unit: "¥/kWh",
      dataDate: "2026-07-07",
      value: 13.75,
      prevDate: "2026-07-06",
      prevValue: 15.56,
      diff: -1.81,
      diffPct: -11.6,
      periodLabel: "前日比",
      rangePosPct: 10.1,
      editor: "haru",
      explanation: "2026-07-07 のJEPX 東京は 13.75¥/kWh（前日比 -1.81¥/kWh・-11.6%）。",
    },
    {
      indicatorId: "fx-usdjpy-monthly-avg",
      label: "USD/JPY (月中平均)",
      unit: "¥/USD",
      dataDate: "2026-06-01",
      value: 160.69,
      prevDate: "2026-05-01",
      prevValue: 158.34,
      diff: 2.35,
      diffPct: 1.5,
      periodLabel: "前月比",
      rangePosPct: 100.0,
      editor: "makoto",
      explanation: "最新月（2026-06）のUSD/JPY (月中平均)は 160.69¥/USD（前月比 +1.5%）。",
    },
  ],
  alerts: [
    {
      indicatorId: "jepx-spot-tokyo",
      label: "JEPX 東京",
      diffPct: -11.6,
      message: "JEPX 東京 が前日比 -11.6% の変動",
    },
  ],
  relatedInsights: ["jp-power-markets-three-layers", "electricity-bill-structure"],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("adaptRemoteSummary: today-v1 → MorningSummary", () => {
  test("ルート項目 + generated フラグ", () => {
    const s = adaptRemoteSummary(REMOTE_FIXTURE);
    expect(s.date).toBe("2026-07-07");
    expect(s.weekday).toBe("火");
    expect(s.weekend).toBe(false);
    expect(s.generatedAt).toBe("2026-07-07T09:52:58+09:00");
    expect(s.weekendNote).toBeNull();
    expect(s.generated).toBe(true);
    expect(s.relatedInsightSlugs).toEqual([
      "jp-power-markets-three-layers",
      "electricity-bill-structure",
    ]);
  });

  test("lines: diff→dod / diffPct→dodPct / editor 写像 / dataDate・periodLabel 保持", () => {
    const s = adaptRemoteSummary(REMOTE_FIXTURE);
    expect(s.lines).toHaveLength(2);

    const jepx = s.lines[0];
    expect(jepx.value).toBe(13.75);
    expect(jepx.dod).toBe(-1.81);
    expect(jepx.dodPct).toBe(-11.6);
    expect(jepx.editor).toBe("ハル"); // haru → ハル
    expect(jepx.dataDate).toBe("2026-07-07");
    expect(jepx.periodLabel).toBe("前日比");

    const fx = s.lines[1];
    expect(fx.editor).toBe("マコト"); // makoto → マコト
    expect(fx.periodLabel).toBe("前月比");
    expect(fx.dataDate).toBe("2026-06-01");
  });

  test("alerts: diffPct→dodPct へ写像", () => {
    const s = adaptRemoteSummary(REMOTE_FIXTURE);
    expect(s.alerts).toHaveLength(1);
    expect(s.alerts[0].indicatorId).toBe("jepx-spot-tokyo");
    expect(s.alerts[0].dodPct).toBe(-11.6);
  });

  test("mapRemoteEditor: haru/makoto/未知値", () => {
    expect(mapRemoteEditor("haru")).toBe("ハル");
    expect(mapRemoteEditor("makoto")).toBe("マコト");
    expect(mapRemoteEditor("リン")).toBe("リン");
    expect(mapRemoteEditor("unknown")).toBe("ハル"); // フォールバック
  });
});

describe("fetch 層: graceful 失敗", () => {
  test("fetchLatestSummary: 成功時は adapt して generated=true", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => REMOTE_FIXTURE,
    } as Response);
    const s = await fetchLatestSummary();
    expect(s).not.toBeNull();
    expect(s!.generated).toBe(true);
    expect(s!.lines[0].value).toBe(13.75);
  });

  test("fetchLatestSummary: ネットワーク例外時は null", async () => {
    // fetchWithRetry がネットワーク例外を 3 回リトライする。実時間スリープを避け
    // fake timers でバックオフを消化し、最終的に null へ graceful fallback する。
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const p = fetchLatestSummary();
    await vi.runAllTimersAsync();
    expect(await p).toBeNull();
  });

  test("fetchLatestSummary: !res.ok や schema 不整合は null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);
    expect(await fetchLatestSummary()).toBeNull();
  });

  test("fetchArchiveIndex: 失敗時は空配列", async () => {
    // 同上: リトライ後のバックオフを fake timers で消化してから空配列へ収束。
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const p = fetchArchiveIndex();
    await vi.runAllTimersAsync();
    expect(await p).toEqual([]);
  });
});
