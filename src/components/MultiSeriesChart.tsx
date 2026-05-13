"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  COMPARE_COLORS,
  computeStats,
  filterByPeriod,
  normalize,
  type CompareNorm,
  type ComparePeriod,
  type SeriesStats,
} from "@/lib/compare-helpers";
import { fetchSeries, type SeriesMeta, type SeriesPoint } from "@/lib/series";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export interface MultiSeriesChartProps {
  ids: string[];
  period: ComparePeriod;
  from?: string | null;
  to?: string | null;
  norm: CompareNorm;
  height?: number;
  onStatsUpdate?: (
    rows: { id: string; meta: SeriesMeta | null; stats: SeriesStats }[],
  ) => void;
}

interface LoadedSeries {
  id: string;
  meta: SeriesMeta;
  points: SeriesPoint[];
}

const NORM_AXIS_LABEL: Record<CompareNorm, string> = {
  raw: "値 (生)",
  index100: "Index (base=100)",
  zscore: "Z-score",
};

export default function MultiSeriesChart({
  ids,
  period,
  from,
  to,
  norm,
  height = 400,
  onStatsUpdate,
}: MultiSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [series, setSeries] = useState<LoadedSeries[]>([]);
  const [errors, setErrors] = useState<{ id: string; message: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const idsKey = useMemo(() => ids.join(","), [ids]);

  useEffect(() => {
    if (ids.length === 0) {
      setSeries([]);
      setErrors([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrors([]);
    Promise.all(
      ids.map((id) =>
        fetchSeries(id)
          .then(
            (r): { ok: true; data: LoadedSeries } => ({
              ok: true,
              data: { id, meta: r.meta, points: r.points },
            }),
          )
          .catch(
            (e: unknown): { ok: false; id: string; message: string } => ({
              ok: false,
              id,
              message: e instanceof Error ? e.message : "fetch failed",
            }),
          ),
      ),
    ).then((results) => {
      if (cancelled) return;
      const ok: LoadedSeries[] = [];
      const errs: { id: string; message: string }[] = [];
      for (const r of results) {
        if (r.ok) ok.push(r.data);
        else errs.push({ id: r.id, message: r.message });
      }
      setSeries(ok);
      setErrors(errs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey, ids]);

  // 期間 + 正規化 + 統計を計算 (ids 順を保持)
  const processed = useMemo(() => {
    return series.map((s, i) => {
      const filtered = filterByPeriod(s.points, period, from, to);
      const normalized = normalize(filtered, norm);
      const stats = computeStats(normalized);
      return {
        id: s.id,
        meta: s.meta,
        color: COMPARE_COLORS[i % COMPARE_COLORS.length],
        points: normalized,
        stats,
      };
    });
  }, [series, period, from, to, norm]);

  // 統計を親に通知 (loading 中は通知しない)
  useEffect(() => {
    if (!onStatsUpdate) return;
    if (loading) return;
    if (processed.length === 0 && series.length === 0) {
      onStatsUpdate([]);
      return;
    }
    onStatsUpdate(
      processed.map((p) => ({ id: p.id, meta: p.meta, stats: p.stats })),
    );
  }, [processed, onStatsUpdate, loading, series.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }
    if (processed.length === 0) {
      chartRef.current.clear();
      return;
    }

    const legendData = processed.map((p) => p.meta.name);

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 64, right: 24, top: 48, bottom: 60 },
        legend: {
          data: legendData,
          textStyle: { color: "#475569" },
          top: 8,
          type: "scroll",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          valueFormatter: (v: number | null) =>
            v == null
              ? "—"
              : v.toLocaleString("ja-JP", { maximumFractionDigits: 4 }),
        },
        xAxis: {
          type: "time",
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#64748b" },
        },
        yAxis: {
          type: "value",
          name: NORM_AXIS_LABEL[norm],
          nameTextStyle: { color: "#475569" },
          axisLabel: { color: "#64748b" },
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        dataZoom: [{ type: "slider", height: 24, bottom: 8 }],
        series: processed.map((p) => ({
          name: p.meta.name,
          type: "line",
          showSymbol: false,
          sampling: "lttb",
          lineStyle: { color: p.color, width: 1.6 },
          itemStyle: { color: p.color },
          data: p.points
            .filter((pt) => pt.value !== null)
            .map((pt) => [pt.date, pt.value as number]),
          connectNulls: false,
        })),
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [processed, norm]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  if (ids.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-faint"
        style={{ height }}
      >
        左の検索ボックスから系列を追加してください (最大 5 件)
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="img"
        aria-label={`系列比較チャート (${ids.length} 系列)`}
        style={{ height }}
        className="rounded-md border border-slate-200 bg-white"
      />
      {loading && (
        <p className="text-xs text-faint" aria-live="polite">
          系列を読み込み中… ({ids.length} 件)
        </p>
      )}
      {errors.length > 0 && (
        <ul className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 space-y-1">
          {errors.map((e) => (
            <li key={e.id}>
              ⚠️ <span className="font-mono">{e.id}</span>: {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
