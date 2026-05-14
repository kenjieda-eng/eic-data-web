"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PlaygroundChart from "./PlaygroundChart";
import type { Indicator } from "@/lib/catalog";
import { pearsonCorrelation } from "@/lib/derived";
import {
  applySingleOp,
  computeLagSweep,
  DEFAULT_PLAYGROUND_STATE,
  parsePlaygroundQuery,
  pickLagPeak,
  PLAYGROUND_OP_HELP,
  PLAYGROUND_OP_LABELS,
  PLAYGROUND_OPS,
  requiredSeriesCount,
  serializePlaygroundQuery,
  type LagSweepPoint,
  type PlaygroundOp,
} from "@/lib/playground-ops";
import { fetchSeries, type SeriesMeta, type SeriesPoint } from "@/lib/series";
import { aggregateMonthly } from "@/lib/series-batch";

interface PlaygroundClientProps {
  indicators: Indicator[];
}

interface LoadedSeries {
  id: string;
  meta: SeriesMeta;
  points: SeriesPoint[];
}

const SERIES_COLORS = ["#047857", "#9333ea"] as const; // A: emerald-700 / B: violet-600
const DERIVED_COLOR = "#0891b2"; // cyan-600

const MA_WINDOWS = [3, 6, 12] as const;

export default function PlaygroundClient({ indicators }: PlaygroundClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialState = useMemo(() => {
    const raw: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      raw[k] = v;
    });
    return parsePlaygroundQuery(raw);
  }, [searchParams]);

  const [a, setA] = useState<string | null>(initialState.a);
  const [b, setB] = useState<string | null>(initialState.b);
  const [op, setOp] = useState<PlaygroundOp>(initialState.op);
  const [maxLag, setMaxLag] = useState<number>(initialState.maxLag);
  const [maWindow, setMaWindow] = useState<number>(initialState.maWindow);

  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");

  const [seriesA, setSeriesA] = useState<LoadedSeries | null>(null);
  const [seriesB, setSeriesB] = useState<LoadedSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const indicatorById = useMemo(() => {
    const m = new Map<string, Indicator>();
    for (const i of indicators) m.set(i.id, i);
    return m;
  }, [indicators]);

  // URL ← 状態
  useEffect(() => {
    const qs = serializePlaygroundQuery({ a, b, op, maxLag, maWindow });
    const target = `/playground${qs}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) {
      router.replace(target, { scroll: false });
    }
  }, [a, b, op, maxLag, maWindow, router]);

  // 系列 A の fetch
  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!a) {
      setSeriesA(null);
      return;
    }
    setLoading(true);
    fetchSeries(a)
      .then((r) => {
        if (cancelled) return;
        setSeriesA({ id: a, meta: r.meta, points: r.points });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(`A の取得失敗 (${a}): ${e instanceof Error ? e.message : "fetch error"}`);
        setSeriesA(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [a]);

  // 系列 B の fetch
  useEffect(() => {
    let cancelled = false;
    if (!b) {
      setSeriesB(null);
      return;
    }
    setLoading(true);
    fetchSeries(b)
      .then((r) => {
        if (cancelled) return;
        setSeriesB({ id: b, meta: r.meta, points: r.points });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(`B の取得失敗 (${b}): ${e instanceof Error ? e.message : "fetch error"}`);
        setSeriesB(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [b]);

  const filteredA = useMemo(() => {
    if (!queryA.trim()) return indicators.slice(0, 20);
    const q = queryA.trim().toLowerCase();
    return indicators
      .filter((i) => i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [indicators, queryA]);

  const filteredB = useMemo(() => {
    if (!queryB.trim()) return indicators.slice(0, 20);
    const q = queryB.trim().toLowerCase();
    return indicators
      .filter((i) => i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [indicators, queryB]);

  const need = requiredSeriesCount(op);

  // 計算結果
  const result = useMemo(() => {
    if (!seriesA) return null;
    if (need === 2 && !seriesB) return null;

    if (op === "correlation" && seriesA && seriesB) {
      const aMonthly = aggregateMonthly(seriesA.points);
      const bMonthly = aggregateMonthly(seriesB.points);
      const r = pearsonCorrelation(aMonthly, bMonthly);
      return { kind: "correlation" as const, r };
    }

    if (op === "lag" && seriesA && seriesB) {
      const sweep = computeLagSweep(seriesA.points, seriesB.points, maxLag);
      const peak = pickLagPeak(sweep);
      return { kind: "lag" as const, sweep, peak };
    }

    // single-op (ma / zscore / logdiff)
    const transformed = applySingleOp(seriesA.points, op as "ma" | "zscore" | "logdiff", {
      maxLag,
      maWindow,
    });
    return {
      kind: "single" as const,
      original: seriesA.points,
      transformed,
    };
  }, [seriesA, seriesB, op, maxLag, maWindow, need]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/playground${serializePlaygroundQuery({
      a,
      b,
      op,
      maxLag,
      maWindow,
    })}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      window.prompt("この URL をコピーしてください", url);
    }
  }, [a, b, op, maxLag, maWindow]);

  const seriesAInfo = a ? indicatorById.get(a) : null;
  const seriesBInfo = b ? indicatorById.get(b) : null;

  return (
    <div className="space-y-6">
      {/* 操作パネル */}
      <section className="rounded-md border border-slate-200 bg-white p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* 系列 A */}
          <div>
            <label
              htmlFor="pg-a"
              className="block text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5"
            >
              系列 A {a && <span className="text-emerald-700">✓</span>}
            </label>
            <input
              id="pg-a"
              type="search"
              value={queryA}
              onChange={(e) => setQueryA(e.target.value)}
              placeholder="系列 ID または名称で検索 (必須)"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {queryA.trim() && (
              <ul className="mt-1.5 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white text-sm divide-y divide-slate-100">
                {filteredA.length === 0 ? (
                  <li className="px-3 py-2 text-faint">該当系列なし</li>
                ) : (
                  filteredA.map((i) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setA(i.id);
                          setQueryA("");
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50"
                      >
                        <span className="font-mono text-xs text-emerald-700">{i.id}</span>
                        <span className="ml-2 text-ink">{i.name}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
            {seriesAInfo && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: SERIES_COLORS[0] }}
                  aria-hidden
                />
                <span className="font-mono text-emerald-700">{seriesAInfo.id}</span>
                <span className="text-subink">／ {seriesAInfo.name}</span>
                <button
                  type="button"
                  onClick={() => setA(null)}
                  className="ml-auto text-faint hover:text-rose-600"
                  aria-label="A を削除"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* 系列 B */}
          <div className={need === 1 ? "opacity-50" : ""}>
            <label
              htmlFor="pg-b"
              className="block text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5"
            >
              系列 B {b && <span className="text-emerald-700">✓</span>}{" "}
              {need === 1 && <span className="text-faint">(この操作では不要)</span>}
            </label>
            <input
              id="pg-b"
              type="search"
              value={queryB}
              onChange={(e) => setQueryB(e.target.value)}
              placeholder={need === 2 ? "系列 ID または名称で検索 (必須)" : "—"}
              disabled={need === 1}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            {need === 2 && queryB.trim() && (
              <ul className="mt-1.5 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white text-sm divide-y divide-slate-100">
                {filteredB.length === 0 ? (
                  <li className="px-3 py-2 text-faint">該当系列なし</li>
                ) : (
                  filteredB.map((i) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setB(i.id);
                          setQueryB("");
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50"
                      >
                        <span className="font-mono text-xs text-emerald-700">{i.id}</span>
                        <span className="ml-2 text-ink">{i.name}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
            {seriesBInfo && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: SERIES_COLORS[1] }}
                  aria-hidden
                />
                <span className="font-mono text-emerald-700">{seriesBInfo.id}</span>
                <span className="text-subink">／ {seriesBInfo.name}</span>
                <button
                  type="button"
                  onClick={() => setB(null)}
                  className="ml-auto text-faint hover:text-rose-600"
                  aria-label="B を削除"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 操作 + パラメータ + 共有 */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <span className="block text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5">
              操作
            </span>
            <div role="radiogroup" aria-label="操作" className="flex flex-wrap gap-1.5">
              {PLAYGROUND_OPS.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={op === o}
                  onClick={() => setOp(o)}
                  className={`px-2.5 py-1 text-[12px] rounded border ${
                    op === o
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-subink hover:border-emerald-400"
                  }`}
                >
                  {PLAYGROUND_OP_LABELS[o]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-faint">{PLAYGROUND_OP_HELP[op]}</p>

            {/* 操作別パラメータ */}
            {op === "lag" && (
              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <label htmlFor="pg-maxlag" className="text-subink">
                  最大ラグ (ヶ月)
                </label>
                <input
                  id="pg-maxlag"
                  type="number"
                  min={1}
                  max={24}
                  value={maxLag}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (Number.isFinite(v) && v >= 1 && v <= 24) setMaxLag(v);
                  }}
                  className="w-16 rounded border border-slate-300 px-1.5 py-0.5"
                />
              </div>
            )}
            {op === "ma" && (
              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span className="text-subink">窓サイズ</span>
                {MA_WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setMaWindow(w)}
                    className={`px-2 py-0.5 rounded border ${
                      maWindow === w
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-white text-subink hover:border-emerald-400"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:self-end">
            <button
              type="button"
              onClick={handleShare}
              disabled={!a}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-faint"
              aria-live="polite"
            >
              {copyStatus === "copied" ? "✓ URL コピー済" : "🔗 URL を共有"}
            </button>
          </div>
        </div>
      </section>

      {/* 結果表示 */}
      <section aria-label="結果" className="space-y-3">
        {error && (
          <div
            role="alert"
            className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
          >
            ⚠️ {error}
          </div>
        )}
        {!a && (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-faint">
            左の検索ボックスから系列 A を選択してください
          </div>
        )}
        {a && need === 2 && !b && (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-faint">
            この操作 ({PLAYGROUND_OP_LABELS[op]}) には系列 B も必要です
          </div>
        )}
        {loading && (
          <p className="text-xs text-faint" aria-live="polite">
            系列を読み込み中…
          </p>
        )}

        {result?.kind === "correlation" && (
          <CorrelationPanel
            r={result.r}
            seriesA={seriesA!}
            seriesB={seriesB!}
          />
        )}
        {result?.kind === "lag" && (
          <LagPanel
            sweep={result.sweep}
            peak={result.peak}
            seriesA={seriesA!}
            seriesB={seriesB!}
            maxLag={maxLag}
          />
        )}
        {result?.kind === "single" && seriesA && (
          <SinglePanel
            original={result.original}
            transformed={result.transformed}
            seriesA={seriesA}
            op={op as "ma" | "zscore" | "logdiff"}
            maWindow={maWindow}
          />
        )}
      </section>

      {/* 使い方 */}
      <section
        aria-label="使い方"
        className="rounded-md border border-slate-200 bg-slate-50 p-4 text-[12px] text-subink leading-relaxed"
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5">
          使い方
        </h2>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>系列 A を必須選択。操作が <strong>相関 / ラグ相関</strong> なら系列 B も選択</li>
          <li>操作を切り替え (5 種): 相関 / ラグ / 移動平均 / Z-score / 対数差分</li>
          <li>結果は自動更新。「URL を共有」で現在の組み合わせを 1 行で共有可能</li>
          <li>
            詳細な可視化が必要なら{" "}
            <Link href="/compare" className="text-emerald-700 underline">
              /compare
            </Link>{" "}
            (最大 5 系列重ね描き)、ラグ相関の専用ページは{" "}
            <Link href="/insight/network" className="text-emerald-700 underline">
              /insight/network
            </Link>
            ／個別 Insight ページから
          </li>
        </ol>
      </section>
    </div>
  );
}

// =============================================================================
// 結果表示パネル
// =============================================================================

function formatR(r: number | null): string {
  if (r === null || !Number.isFinite(r)) return "—";
  return r.toFixed(3);
}

function interpretR(r: number | null): string {
  if (r === null) return "共通月不足 (3 点未満) もしくは分散ゼロ";
  const abs = Math.abs(r);
  const direction = r > 0 ? "正の" : r < 0 ? "負の" : "";
  if (abs >= 0.8) return `強い ${direction}相関`;
  if (abs >= 0.5) return `中程度の ${direction}相関`;
  if (abs >= 0.3) return `弱い ${direction}相関`;
  return "ほぼ無相関";
}

function CorrelationPanel({
  r,
  seriesA,
  seriesB,
}: {
  r: number | null;
  seriesA: LoadedSeries;
  seriesB: LoadedSeries;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 space-y-2">
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-faint">
        相関係数 r (月次共通月)
      </h2>
      <div className="text-4xl font-bold tabular-nums text-ink">{formatR(r)}</div>
      <p className="text-[12px] text-subink">{interpretR(r)}</p>
      <p className="text-[11px] text-faint">
        <strong>{seriesA.meta.name}</strong> × <strong>{seriesB.meta.name}</strong>
        ／全期間 (共通月のみ)
      </p>
    </div>
  );
}

function LagPanel({
  sweep,
  peak,
  seriesA,
  seriesB,
  maxLag,
}: {
  sweep: LagSweepPoint[];
  peak: LagSweepPoint | null;
  seriesA: LoadedSeries;
  seriesB: LoadedSeries;
  maxLag: number;
}) {
  const W = 600;
  const H = 200;
  const barW = sweep.length > 0 ? W / sweep.length : 0;
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 space-y-2">
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-faint">
        ラグ相関スイープ (0〜{maxLag} ヶ月)
      </h2>
      {peak && (
        <p className="text-[12px] text-subink">
          ピーク: <strong className="text-rose-700">lag {peak.lagMonths} ヶ月 (r = {peak.r.toFixed(3)})</strong>
        </p>
      )}
      <div className="mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H + 40}`}
          width="100%"
          height={H + 40}
          role="img"
          aria-label="lag correlation bars"
          className="bg-slate-50 rounded"
        >
          {/* zero line */}
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#cbd5e1" strokeWidth={1} />
          {sweep.map((s, i) => {
            const isPeak = peak && s.lagMonths === peak.lagMonths;
            const h = Math.abs(s.r) * (H / 2);
            const y = s.r >= 0 ? H / 2 - h : H / 2;
            return (
              <g key={s.lagMonths}>
                <rect
                  x={i * barW + barW * 0.15}
                  y={y}
                  width={barW * 0.7}
                  height={h}
                  fill={isPeak ? "#dc2626" : "#0ea5e9"}
                />
                <text
                  x={i * barW + barW / 2}
                  y={s.r >= 0 ? y - 3 : y + h + 11}
                  fontSize={9}
                  fill="#475569"
                  textAnchor="middle"
                >
                  {s.r.toFixed(2)}
                </text>
                <text
                  x={i * barW + barW / 2}
                  y={H + 14}
                  fontSize={10}
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {s.lagMonths}m
                </text>
              </g>
            );
          })}
          {/* y axis labels */}
          <text x={4} y={12} fontSize={10} fill="#64748b">+1.0</text>
          <text x={4} y={H / 2 - 2} fontSize={10} fill="#64748b">0</text>
          <text x={4} y={H - 2} fontSize={10} fill="#64748b">-1.0</text>
          {/* x axis label */}
          <text x={W / 2} y={H + 32} fontSize={10} fill="#475569" textAnchor="middle">
            lag (ヶ月)
          </text>
        </svg>
      </div>
      <p className="text-[11px] text-faint">
        <strong>{seriesA.meta.name}</strong> を 0〜{maxLag} ヶ月先行させた時の{" "}
        <strong>{seriesB.meta.name}</strong> との月次相関
      </p>
    </div>
  );
}

function SinglePanel({
  original,
  transformed,
  seriesA,
  op,
  maWindow,
}: {
  original: SeriesPoint[];
  transformed: SeriesPoint[];
  seriesA: LoadedSeries;
  op: "ma" | "zscore" | "logdiff";
  maWindow: number;
}) {
  const OP_LABEL: Record<"ma" | "zscore" | "logdiff", string> = {
    ma: `移動平均 (window=${maWindow})`,
    zscore: "Z-score",
    logdiff: "対数差分",
  };
  // ma は元系列と同単位なので重ね描き、それ以外は変換後のみ単独表示
  const overlay = op === "ma";
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 space-y-2">
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-faint">
        {OP_LABEL[op]} — {seriesA.meta.name}
      </h2>
      <PlaygroundChart
        height={360}
        yAxisName={op === "zscore" ? "Z-score" : op === "logdiff" ? "ln diff" : seriesA.meta.unit}
        series={
          overlay
            ? [
                {
                  name: `${seriesA.meta.name} (元)`,
                  color: SERIES_COLORS[0],
                  points: original,
                },
                {
                  name: `${OP_LABEL[op]}`,
                  color: DERIVED_COLOR,
                  points: transformed,
                  dashed: true,
                },
              ]
            : [
                {
                  name: `${OP_LABEL[op]}`,
                  color: DERIVED_COLOR,
                  points: transformed,
                },
              ]
        }
      />
      <p className="text-[11px] text-faint">
        出典:{" "}
        <a
          href={seriesA.meta.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          {seriesA.meta.source_name}
        </a>
        ／as-of {seriesA.meta.observation_cutoff}
      </p>
    </div>
  );
}
