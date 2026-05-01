"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { fetchSeries, type SeriesMeta, type SeriesPoint } from "@/lib/series";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export interface ChartLineProps {
  id: string;
  height?: number;
  unit?: string;
  color?: string;
  showZoom?: boolean;
}

export default function ChartLine({
  id,
  height = 320,
  unit,
  color = "#047857",
  showZoom = true,
}: ChartLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [meta, setMeta] = useState<SeriesMeta | null>(null);
  const [points, setPoints] = useState<SeriesPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setPoints(null);
    setMeta(null);
    fetchSeries(id)
      .then((data) => {
        if (cancelled) return;
        setMeta(data.meta);
        setPoints(data.points);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load series");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!containerRef.current || !points || !meta) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }

    const displayUnit = unit ?? meta.unit;
    const data = points
      .filter((p) => p.value !== null)
      .map((p) => [p.date, p.value as number]);

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 56, right: 24, top: 32, bottom: showZoom ? 60 : 32 },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          valueFormatter: (v: number | null) =>
            v == null
              ? "—"
              : `${v.toLocaleString("ja-JP", {
                  maximumFractionDigits: 4,
                })} ${displayUnit}`,
        },
        xAxis: {
          type: "time",
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#64748b" },
        },
        yAxis: {
          type: "value",
          name: displayUnit,
          nameTextStyle: { color: "#475569" },
          axisLabel: { color: "#64748b" },
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        dataZoom: showZoom
          ? [{ type: "slider", height: 24, bottom: 8 }]
          : [],
        series: [
          {
            name: meta.name,
            type: "line",
            showSymbol: false,
            sampling: "lttb",
            lineStyle: { color, width: 1.6 },
            data,
            connectNulls: false,
          },
        ],
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [points, meta, color, showZoom, unit]);

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

  if (!points || !meta) {
    return (
      <div
        aria-busy="true"
        className="flex items-center justify-center rounded-md border border-slate-200 bg-paper text-sm text-faint"
        style={{ height }}
      >
        Loading {id}…
      </div>
    );
  }

  return (
    <figure className="rounded-md border border-slate-200 bg-white p-2">
      <figcaption className="mb-1 px-2 text-xs text-subink">
        <strong className="text-ink">{meta.name}</strong>
        （出典:{" "}
        <a
          href={meta.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          {meta.source_name}
        </a>
        ／as-of {meta.observation_cutoff}／{meta.license}）
      </figcaption>
      <div
        ref={containerRef}
        role="img"
        aria-label={`${meta.name} の時系列チャート`}
        style={{ height }}
      />
    </figure>
  );
}
