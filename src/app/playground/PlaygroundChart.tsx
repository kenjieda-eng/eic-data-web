"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { SeriesPoint } from "@/lib/series";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export interface PlaygroundChartSeries {
  name: string;
  color: string;
  points: SeriesPoint[];
  /** 'solid' (元系列) or 'dashed' (派生 / 変換後) */
  dashed?: boolean;
}

/**
 * 任意の数の SeriesPoint[] を 1 つの ECharts 図に重ね描き。
 * /playground 専用の汎用チャート (catalog id を必要としない、加工済データを直接受け取る)。
 */
export default function PlaygroundChart({
  series,
  height = 360,
  yAxisName,
}: {
  series: PlaygroundChartSeries[];
  height?: number;
  yAxisName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }

    if (series.length === 0) {
      chartRef.current.clear();
      return;
    }

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 64, right: 24, top: 48, bottom: 60 },
        legend: {
          data: series.map((s) => s.name),
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
          name: yAxisName,
          nameTextStyle: { color: "#475569" },
          axisLabel: { color: "#64748b" },
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        dataZoom: [{ type: "slider", height: 24, bottom: 8 }],
        series: series.map((s) => ({
          name: s.name,
          type: "line",
          showSymbol: false,
          sampling: "lttb",
          lineStyle: {
            color: s.color,
            width: 1.6,
            type: s.dashed ? "dashed" : "solid",
          },
          itemStyle: { color: s.color },
          data: s.points
            .filter((p) => p.value !== null && Number.isFinite(p.value))
            .map((p) => [p.date, p.value as number]),
          connectNulls: false,
        })),
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [series, yAxisName]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Playground multi-series chart"
      style={{ height }}
      className="rounded-md border border-slate-200 bg-white"
    />
  );
}
