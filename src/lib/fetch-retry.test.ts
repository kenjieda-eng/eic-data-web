import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fetchWithRetry } from "./fetch-retry";

/**
 * global fetch をモックし、実時間スリープしないよう fake timers で待機を進める。
 * 各ケースは `const p = fetchWithRetry(...); await vi.runAllTimersAsync(); await p`
 * のパターンでバックオフを瞬時に消化する。
 */

const URL = "https://raw.githubusercontent.com/example/repo/main/data.json";

function makeResponse(
  status: number,
  headers?: Record<string, string>,
): Response {
  return new Response(status === 204 ? null : "body", { status, headers });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchWithRetry", () => {
  test("429 が 2 回続いた後 200 で成功する", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(429))
      .mockResolvedValueOnce(makeResponse(429))
      .mockResolvedValueOnce(makeResponse(200));

    const p = fetchWithRetry(URL);
    await vi.runAllTimersAsync();
    const res = await p;

    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("maxRetries 超過時は最後の Response (5xx) をそのまま返す", async () => {
    fetchMock.mockResolvedValue(makeResponse(503));

    const p = fetchWithRetry(URL);
    await vi.runAllTimersAsync();
    const res = await p;

    // 既定 maxRetries=3 → 計 4 試行してから諦め、最後の 503 を返す。
    expect(res.status).toBe(503);
    expect(res.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test("404 (その他 4xx) はリトライせず即座に返す", async () => {
    fetchMock.mockResolvedValue(makeResponse(404));

    const p = fetchWithRetry(URL);
    await vi.runAllTimersAsync();
    const res = await p;

    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("429 + Retry-After ヘッダ (秒) があれば指数バックオフより優先する", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(429, { "retry-after": "2" }))
      .mockResolvedValueOnce(makeResponse(200));

    const p = fetchWithRetry(URL);

    // Retry-After=2s。1900ms 進めても 2 回目 fetch はまだ呼ばれない。
    // 基準バックオフ (500ms + 最大 250ms ジッタ) なら既に発火しているはずで、
    // これにより Retry-After が優先されていることを判別できる。
    await vi.advanceTimersByTimeAsync(1900);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 残りを進めると 2 秒経過で 2 回目 fetch → 200。
    await vi.advanceTimersByTimeAsync(200);
    const res = await p;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("init (next.revalidate 等) はそのまま fetch へ透過する", async () => {
    fetchMock.mockResolvedValue(makeResponse(200));
    const init = { next: { revalidate: 86400 } };

    const p = fetchWithRetry(URL, init);
    await vi.runAllTimersAsync();
    await p;

    expect(fetchMock).toHaveBeenCalledWith(URL, init);
  });
});
