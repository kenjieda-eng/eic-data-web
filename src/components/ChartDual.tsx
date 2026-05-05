"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  fetchSeries,
  type SeriesMeta,
  type SeriesPoint,
} from "@/lib/series";
import { aggregateMonthly, alignMonthly } from "@/lib/series-batch";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export interface ChartDualProps {
  leftId: string;
  rightId: string;
  leftTitle?: string;
  rightTitle?: string;
  leftAxisName?: string;
  rightAxisName?: string;
  leftColor?: string;
  rightColor?: string;
  freq?: "daily" | "monthly";
  height?: number;
  showZoom?: boolean;
}

interface DualData {
  leftMeta: SeriesMeta;
  rightMeta: SeriesMeta;
  aligned: { date: string; aValue: number; bValue: number }[];
}

export default function ChartDual({
  leftId,
  rightId,
  leftTitle,
  rightTitle,
  leftAxisName,
  rightAxisName,
  leftColor = "#9333ea",
  rightColor = "#0891b2",
  freq = "monthly",
  height = 320,
  showZoom = true,
}: ChartDualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<DualData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    Promise.all([fetchSeries(leftId), fetchSeries(rightId)])
      .then(([leftRaw, rightRaw]) => {
        if (cancelled) return;
        const leftPts =
          freq === "monthly"
            ? aggregateMonthly(leftRaw.points)
            : leftRaw.points;
        const rightPts =
          freq === "monthly"
            ? aggregateMonthly(rightRaw.points)
            : rightRaw.points;
        const aligned = alignMonthly(leftPts, rightPts);
        setData({
          leftMeta: leftRaw.meta,
          rightMeta: rightRaw.meta,
          aligned,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load series");
      });
    return () => {
      cancelled = true;
    };
  }, [leftId, rightId, freq]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }

    const leftName = leftTitle ?? data.leftMeta.name;
    const rightName = rightTitle ?? data.rightMeta.name;
    const leftUnit = leftAxisName ?? data.leftMeta.unit;
    const rightUnit = rightAxisName ?? data.rightMeta.unit;

    const xData = data.aligned.map((p) => p.date);
    const leftValues = data.aligned.map((p) => p.aValue);
    const rightValues = data.aligned.map((p) => p.bValue);

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 64, right: 64, top: 40, bottom: showZoom ? 60 : 32 },
        legend: {
          data: [leftName, rightName],
          textStyle: { color: "#475569" },
          top: 8,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
        },
        xAxis: {
          type: "category",
          data: xData,
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#64748b" },
          boundaryGap: false,
        },
        yAxis: [
          {
            type: "value",
            name: leftUnit,
            position: "left",
            nameTextStyle: { color: leftColor },
            axisLabel: {
              color: "#64748b",
              formatter: (v: number) =>
                v.toLocaleString("ja-JP", { maximumFractionDigits: 4 }),
            },
            splitLine: { lineStyle: { color: "#e2e8f0" } },
          },
          {
            type: "value",
            name: rightUnit,
            position: "right",
            nameTextStyle: { color: rightColor },
            axisLabel: {
              color: "#64748b",
              formatter: (v: number) =>
                v.toLocaleString("ja-JP", { maximumFractionDigits: 4 }),
            },
            splitLine: { show: false },
          },
        ],
        dataZoom: showZoom
          ? [{ type: "slider", height: 24, bottom: 8 }]
          : [],
        series: [
          {
            name: leftName,
            type: "line",
            yAxisIndex: 0,
            showSymbol: false,
            sampling: "lttb",
            lineStyle: { color: leftColor, width: 1.6 },
            itemStyle: { color: leftColor },
            data: leftValues,
            connectNulls: false,
          },
          {
            name: rightName,
            type: "line",
            yAxisIndex: 1,
            showSymbol: false,
            sampling: "lttb",
            lineStyle: { color: rightColor, width: 1.6 },
            itemStyle: { color: rightColor },
            data: rightValues,
            connectNulls: false,
          },
        ],
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, leftTitle, rightTitle, leftAxisName, rightAxisName, leftColor, rightColor, showZoom]);

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
        Loading {leftId} × {rightId}…
      </div>
    );
  }

  return (
    <figure className="rounded-md border border-slate-200 bg-white p-2">
      <figcaption className="mb-1 px-2 text-xs text-subink">
        <span className="block">
          <strong className="text-ink" style={{ color: leftColor }}>
            {leftTitle ?? data.leftMeta.name}
          </strong>
          （出典:{" "}
          <a
            href={data.leftMeta.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            {data.leftMeta.source_name}
          </a>
          ／as-of {data.leftMeta.observation_cutoff}／{data.leftMeta.license}）
        </span>
        <span className="block">
          <strong className="text-ink" style={{ color: rightColor }}>
            {rightTitle ?? data.rightMeta.name}
          </strong>
          （出典:{" "}
          <a
            href={data.rightMeta.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            {data.rightMeta.source_name}
          </a>
          ／as-of {data.rightMeta.observation_cutoff}／{data.rightMeta.license}）
        </span>
      </figcaption>
      <div
        ref={containerRef}
        role="img"
        aria-label={`${leftTitle ?? data.leftMeta.name} と ${rightTitle ?? data.rightMeta.name} の 2 軸時系列チャート`}
        style={{ height }}
      />
    </figure>
  );
}
