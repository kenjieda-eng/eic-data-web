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
import {
  fetchSeries,
  type SeriesMeta,
  type SeriesPoint,
} from "@/lib/series";
import { aggregateMonthly, alignMonthly } from "@/lib/series-batch";
import { computeSpread } from "@/lib/spread-data";

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

export interface ChartSpreadProps {
  spreadAId: string;
  spreadBId: string;
  comparisonId?: string;
  spreadLabel?: string;
  comparisonLabel?: string;
  spreadAxisName?: string;
  comparisonAxisName?: string;
  spreadColor?: string;
  comparisonColor?: string;
  height?: number;
  showZoom?: boolean;
}

interface SpreadData {
  aMeta: SeriesMeta;
  bMeta: SeriesMeta;
  comparisonMeta: SeriesMeta | null;
  dates: string[];
  spreadValues: number[];
  comparisonValues: (number | null)[];
}

export default function ChartSpread({
  spreadAId,
  spreadBId,
  comparisonId,
  spreadLabel,
  comparisonLabel,
  spreadAxisName,
  comparisonAxisName,
  spreadColor = "#dc2626",
  comparisonColor = "#0891b2",
  height = 360,
  showZoom = true,
}: ChartSpreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<SpreadData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);

    const fetches = [fetchSeries(spreadAId), fetchSeries(spreadBId)];
    if (comparisonId) fetches.push(fetchSeries(comparisonId));

    Promise.all(fetches)
      .then((results) => {
        if (cancelled) return;
        const [aRaw, bRaw, compRaw] = results;
        const spreadPoints = computeSpread(aRaw.points, bRaw.points);
        if (spreadPoints.length === 0) {
          setError("共通月がありません（A と B の重なる月が 0 件）");
          return;
        }

        let comparisonValues: (number | null)[] = spreadPoints.map(() => null);
        let comparisonMeta: SeriesMeta | null = null;
        if (compRaw) {
          comparisonMeta = compRaw.meta;
          const compMonthly = aggregateMonthly(compRaw.points);
          const spreadAsPoints: SeriesPoint[] = spreadPoints.map((s) => ({
            date: s.date,
            value: s.value,
          }));
          const aligned = alignMonthly(spreadAsPoints, compMonthly);
          // 共通月のみに spread + comparison を絞る
          const compMap = new Map(
            aligned.map((p) => [p.date.slice(0, 7), p.bValue]),
          );
          comparisonValues = spreadPoints.map((s) =>
            compMap.has(s.date.slice(0, 7))
              ? (compMap.get(s.date.slice(0, 7)) as number)
              : null,
          );
        }

        setData({
          aMeta: aRaw.meta,
          bMeta: bRaw.meta,
          comparisonMeta,
          dates: spreadPoints.map((s) => s.date),
          spreadValues: spreadPoints.map((s) => s.value),
          comparisonValues,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load series");
      });

    return () => {
      cancelled = true;
    };
  }, [spreadAId, spreadBId, comparisonId]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }

    const sLabel =
      spreadLabel ?? `${data.aMeta.name} − ${data.bMeta.name}`;
    const cLabel =
      data.comparisonMeta &&
      (comparisonLabel ?? data.comparisonMeta.name);

    const sUnit = spreadAxisName ?? data.aMeta.unit;
    const cUnit =
      comparisonAxisName ?? data.comparisonMeta?.unit ?? "";

    const yAxis: echarts.EChartsCoreOption["yAxis"] = data.comparisonMeta
      ? [
          {
            type: "value",
            name: sUnit,
            position: "left",
            nameTextStyle: { color: spreadColor },
            axisLabel: {
              color: "#64748b",
              formatter: (v: number) =>
                v.toLocaleString("ja-JP", { maximumFractionDigits: 2 }),
            },
            splitLine: { lineStyle: { color: "#e2e8f0" } },
          },
          {
            type: "value",
            name: cUnit,
            position: "right",
            nameTextStyle: { color: comparisonColor },
            axisLabel: {
              color: "#64748b",
              formatter: (v: number) =>
                v.toLocaleString("ja-JP", { maximumFractionDigits: 2 }),
            },
            splitLine: { show: false },
          },
        ]
      : {
          type: "value",
          name: sUnit,
          nameTextStyle: { color: spreadColor },
          axisLabel: {
            color: "#64748b",
            formatter: (v: number) =>
              v.toLocaleString("ja-JP", { maximumFractionDigits: 2 }),
          },
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        };

    const series: echarts.EChartsCoreOption["series"] = [
      {
        name: sLabel,
        type: "line",
        yAxisIndex: 0,
        showSymbol: false,
        sampling: "lttb",
        lineStyle: { color: spreadColor, width: 1.6 },
        itemStyle: { color: spreadColor },
        data: data.spreadValues,
        connectNulls: false,
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: {
            color: "#94a3b8",
            type: "dashed",
            width: 1,
          },
          label: {
            formatter: "0 (パリティ)",
            color: "#94a3b8",
            position: "insideEndTop",
          },
          data: [{ yAxis: 0 }],
        },
      },
    ];

    if (data.comparisonMeta && cLabel) {
      (series as Array<Record<string, unknown>>).push({
        name: cLabel,
        type: "line",
        yAxisIndex: 1,
        showSymbol: false,
        sampling: "lttb",
        lineStyle: { color: comparisonColor, width: 1.6 },
        itemStyle: { color: comparisonColor },
        data: data.comparisonValues,
        connectNulls: false,
      });
    }

    chartRef.current.setOption(
      {
        animation: false,
        grid: {
          left: 64,
          right: data.comparisonMeta ? 64 : 24,
          top: 40,
          bottom: showZoom ? 60 : 32,
        },
        legend: {
          data: data.comparisonMeta && cLabel ? [sLabel, cLabel] : [sLabel],
          textStyle: { color: "#475569" },
          top: 8,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
        },
        xAxis: {
          type: "category",
          data: data.dates,
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#64748b" },
          boundaryGap: false,
        },
        yAxis,
        dataZoom: showZoom ? [{ type: "slider", height: 24, bottom: 8 }] : [],
        series,
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    data,
    spreadLabel,
    comparisonLabel,
    spreadAxisName,
    comparisonAxisName,
    spreadColor,
    comparisonColor,
    showZoom,
  ]);

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
        Computing spread {spreadAId} − {spreadBId}
        {comparisonId ? ` × ${comparisonId}` : ""}…
      </div>
    );
  }

  return (
    <figure className="rounded-md border border-slate-200 bg-white p-2">
      <figcaption className="mb-1 px-2 text-xs text-subink">
        <span className="block">
          <strong className="text-ink" style={{ color: spreadColor }}>
            {spreadLabel ?? `${data.aMeta.name} − ${data.bMeta.name}`}
          </strong>
          （出典:{" "}
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
          ／as-of {data.aMeta.observation_cutoff} ＋{" "}
          {data.bMeta.observation_cutoff}）
        </span>
        {data.comparisonMeta && (
          <span className="block">
            <strong className="text-ink" style={{ color: comparisonColor }}>
              {comparisonLabel ?? data.comparisonMeta.name}
            </strong>
            （出典:{" "}
            <a
              href={data.comparisonMeta.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-800"
            >
              {data.comparisonMeta.source_name}
            </a>
            ／as-of {data.comparisonMeta.observation_cutoff}／
            {data.comparisonMeta.license}）
          </span>
        )}
      </figcaption>
      <div
        ref={containerRef}
        role="img"
        aria-label={`${data.aMeta.name} と ${data.bMeta.name} のスプレッド${
          data.comparisonMeta ? ` × ${data.comparisonMeta.name}` : ""
        }のチャート`}
        style={{ height }}
      />
    </figure>
  );
}
