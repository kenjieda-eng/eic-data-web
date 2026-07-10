/**
 * fetchWithRetry — GitHub raw 取得の 429/5xx 耐性ラッパ
 *
 * ビルド時 (build/ISR) にサーバーが raw.githubusercontent へ多数の fetch を
 * バーストさせると、同一 IP のレート制限で 429 が返り得る (#134 のフォローアップ)。
 * ここで指数バックオフ付きの薄いリトライを一枚かませ、一過性の 429/5xx/
 * ネットワーク例外を吸収する。
 *
 * 方針:
 *   - リトライ対象は HTTP 429・5xx・fetch 自体のネットワーク例外のみ。
 *     404 等その他 4xx はリトライせず、そのまま Response を返す。
 *   - 既定 maxRetries=3 (計 4 試行)。バックオフ 500 → 1500 → 4000ms + 0〜250ms ジッタ。
 *   - 429 に Retry-After (秒) があればそちらを優先 (上限 10 秒でキャップ)。
 *   - 最終試行でも失敗ならその Response を返す (ネットワーク例外は throw)。
 *     呼び出し側の既存 `!res.ok` / try-catch 処理をそのまま活かす。
 *   - init はそのまま透過し、next.revalidate 等のキャッシュ指定を壊さない。
 */

const DEFAULT_MAX_RETRIES = 3;

/** バックオフ基準 (ms)。attempt 0→500, 1→1500, 2→4000。以降は末尾値を流用。 */
const BACKOFF_BASE_MS = [500, 1500, 4000];

/** バックオフに上乗せするジッタの上限 (ms)。 */
const JITTER_MAX_MS = 250;

/** Retry-After (秒) を尊重する際の上限 (ms)。過大な待機を防ぐ。 */
const RETRY_AFTER_CAP_MS = 10_000;

/** 429 / 5xx はリトライ対象。404 等その他 4xx や成功は対象外。 */
function isRetriableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

/**
 * Retry-After ヘッダ (秒指定) を ms へ。ヘッダ不在・非数値・負値は null。
 * HTTP-date 形式は扱わず null（秒指定のみサポート、GitHub は秒を返す）。
 */
function parseRetryAfterMs(res: Response): number | null {
  const raw = res.headers.get("retry-after");
  if (!raw) return null;
  const secs = Number(raw.trim());
  if (!Number.isFinite(secs) || secs < 0) return null;
  return secs * 1000;
}

/** attempt 回目の失敗後に待つ ms。Retry-After があればキャップ付きで優先。 */
function backoffDelayMs(attempt: number, retryAfterMs: number | null): number {
  if (retryAfterMs !== null) {
    return Math.min(retryAfterMs, RETRY_AFTER_CAP_MS);
  }
  const base = BACKOFF_BASE_MS[Math.min(attempt, BACKOFF_BASE_MS.length - 1)];
  return base + Math.floor(Math.random() * JITTER_MAX_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit & { next?: unknown },
  opts?: { maxRetries?: number },
): Promise<Response> {
  const maxRetries = opts?.maxRetries ?? DEFAULT_MAX_RETRIES;

  // attempt は 0..maxRetries (計 maxRetries + 1 試行)。
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      // ネットワーク例外はリトライ対象。最終試行なら呼び出し側へ throw を伝播。
      if (attempt >= maxRetries) throw err;
      await sleep(backoffDelayMs(attempt, null));
      continue;
    }

    // 成功 or リトライ非対象 (404 等その他 4xx を含む) はそのまま返す。
    if (res.ok || !isRetriableStatus(res.status)) {
      return res;
    }

    // 429/5xx: 最終試行ならその Response を返し、既存の !res.ok 処理に委ねる。
    if (attempt >= maxRetries) {
      return res;
    }

    const retryAfterMs = res.status === 429 ? parseRetryAfterMs(res) : null;
    await sleep(backoffDelayMs(attempt, retryAfterMs));
  }
}
