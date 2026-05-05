"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { fetchSeries, type SeriesMeta } from "@/lib/series";
import { decompose3Factor, type DecompPoint } from "@/lib/derived";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export interface ChartDecompProps {
  factorAId: string;
  factorBId: string;
  baseYM: string;
  labelA?: string;
  labelB?: string;
  labelInteraction?: string;
  unit?: string;
  height?: number;
  colorA?: string;
  colorB?: string;
  colorInteraction?: string;
}

interface DecompData {
  aMeta: SeriesMeta;
  bMeta: SeriesMeta;
  results: DecompPoint[];
  baseDate: string;
}

export default function ChartDecomp({
  factorAId,
  factorBId,
  baseYM,
  labelA,
  labelB,
  labelInteraction = "相乗効果",
  unit,
  height = 360,
  colorA = "#0ea5e9",
  colorB = "#f97316",
  colorInteraction = "#9ca3af",
}: ChartDecompProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<DecompData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    Promise.all([fetchSeries(factorAId), fetchSeries(factorBId)])
      .then(([aRaw, bRaw]) => {
        if (cancelled) return;
        let results: DecompPoint[];
        try {
          results = decompose3Factor(aRaw.points, bRaw.points, baseYM);
        } catch (err) {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "decomposition failed");
          return;
        }
        const baseDate =
          results.find((r) => r.date.startsWith(baseYM))?.date ?? `${baseYM}-15`;
        setData({
          aMeta: aRaw.meta,
          bMeta: bRaw.meta,
          results,
          baseDate,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load series");
      });
    return () => {
      cancelled = true;
    };
  }, [factorAId, factorBId, baseYM]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }

    const aLabel = labelA ?? `${data.aMeta.name} 要因`;
    const bLabel = labelB ?? `${data.bMeta.name} 要因`;
    const xData = data.results.map((r) => r.date);

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 64, right: 24, top: 48, bottom: 56 },
        legend: {
          data: [aLabel, bLabel, labelInteraction],
          textStyle: { color: "#475569" },
          top: 8,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          valueFormatter: (v: number | null) =>
            v == null
              ? "—"
              : v.toLocaleString("ja-JP", { maximumFractionDigits: 2 }) +
                (unit ? ` ${unit}` : ""),
        },
        xAxis: {
          type: "category",
          data: xData,
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#64748b" },
          boundaryGap: false,
        },
        yAxis: {
          type: "value",
          name: unit ?? "",
          nameTextStyle: { color: "#475569" },
          axisLabel: {
            color: "#64748b",
            formatter: (v: number) =>
              v.toLocaleString("ja-JP", { maximumFractionDigits: 0 }),
          },
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        dataZoom: [{ type: "slider", height: 24, bottom: 8 }],
        series: [
          {
            name: aLabel,
            type: "line",
            stack: "effects",
            symbol: "none",
            smooth: false,
            sampling: "lttb",
            areaStyle: { color: colorA, opacity: 0.7 },
            lineStyle: { color: colorA, width: 1 },
            itemStyle: { color: colorA },
            data: data.results.map((r) => r.aEffect),
          },
          {
            name: bLabel,
            type: "line",
            stack: "effects",
            symbol: "none",
            smooth: false,
            sampling: "lttb",
            areaStyle: { color: colorB, opacity: 0.7 },
            lineStyle: { color: colorB, width: 1 },
            itemStyle: { color: colorB },
            data: data.results.map((r) => r.bEffect),
          },
          {
            name: labelInteraction,
            type: "line",
            stack: "effects",
            symbol: "none",
            smooth: false,
            sampling: "lttb",
            areaStyle: { color: colorInteraction, opacity: 0.7 },
            lineStyle: { color: colorInteraction, width: 1 },
            itemStyle: { color: colorInteraction },
            data: data.results.map((r) => r.interaction),
            markLine: {
              silent: true,
              symbol: "none",
              lineStyle: { color: "#dc2626", type: "dashed", width: 1 },
              label: {
                formatter: `基準: ${baseYM}`,
                color: "#dc2626",
                position: "insideEndTop",
              },
              data: [{ xAxis: data.baseDate }],
            },
          },
        ],
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, labelA, labelB, labelInteraction, unit, colorA, colorB, colorInteraction, baseYM]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-sm text-rose-700"
        style={{ height }}
      >
        ⚠️ {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        aria-busy="true"
        className="flex items-center justify-center rounded-md border border-slate-200 bg-paper text-sm text-faint"
        style={{ height }}
      >
        Decomposing {factorAId} × {factorBId} (base {baseYM})…
      </div>
    );
  }

  const aLabel = labelA ?? `${data.aMeta.name} 要因`;
  const bLabel = labelB ?? `${data.bMeta.name} 要因`;

  return (
    <figure className="rounded-md border border-slate-200 bg-white p-2">
      <figcaption className="mb-1 px-2 text-xs text-subink">
        <span className="block">
          <strong className="text-ink">
            Δ(A × B) = ΔA · B₀ + A₀ · ΔB + ΔA · ΔB
          </strong>{" "}
          基準月 <strong>{baseYM}</strong>{" "}
          {unit ? <>（単位: {unit}）</> : null}
        </span>
        <span className="block">
          <span style={{ color: colorA }}>■</span> {aLabel} ／{" "}
          <span style={{ color: colorB }}>■</span> {bLabel} ／{" "}
          <span style={{ color: colorInteraction }}>■</span>{" "}
          {labelInteraction}
        </span>
        <span className="block">
          出典:{" "}
          <a
            href={data.aMeta.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            {data.aMeta.source_name}
          </a>
          ＋
          <a
            href={data.bMeta.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            {data.bMeta.source_name}
          </a>
          ／as-of {data.aMeta.observation_cutoff} ＋ {data.bMeta.observation_cutoff}
        </span>
      </figcaption>
      <div
        ref={containerRef}
        role="img"
        aria-label={`${data.aMeta.name} と ${data.bMeta.name} の積の加法 3 要因分解（基準月 ${baseYM}）`}
        style={{ height }}
      />
    </figure>
  );
}
