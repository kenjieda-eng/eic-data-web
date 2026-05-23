"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export interface BalancingProductSeries {
  id: string;
  name: string;
  color: string;
  points: { date: string; value: number | null }[];
}

interface Props {
  series: BalancingProductSeries[];
  ceiling: number;
  unit: string;
  height?: number;
}

function fyLabel(iso: string): string {
  // CSV date は会計年度開始月 (4/1) を入れている。"2024-04-01" → "FY2024"
  const m = /^(\d{4})-04-01$/.exec(iso);
  if (m) return `FY${m[1]}`;
  return iso.slice(0, 7);
}

export default function BalancingProductsChart({
  series,
  ceiling,
  unit,
  height = 360,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current, undefined, {
        renderer: "canvas",
      });
    }

    const allDates = Array.from(
      new Set(series.flatMap((s) => s.points.map((p) => p.date))),
    ).sort();
    const categories = allDates.map(fyLabel);

    const echartsSeries = series.map((s) => {
      const byDate = new Map(s.points.map((p) => [p.date, p.value]));
      return {
        name: s.name,
        type: "line" as const,
        showSymbol: true,
        symbolSize: 7,
        connectNulls: false,
        lineStyle: { color: s.color, width: 1.8 },
        itemStyle: { color: s.color },
        data: allDates.map((d) => byDate.get(d) ?? null),
      };
    });

    if (echartsSeries.length > 0) {
      // 上限価格の参照線は最初の系列に markLine としてぶら下げる
      // (markLine 自体は 1 本だけ描画される)
      (echartsSeries[0] as Record<string, unknown>).markLine = {
        symbol: "none",
        silent: true,
        lineStyle: { color: "#94a3b8", type: "dashed", width: 1 },
        label: {
          formatter: `上限価格 ${ceiling}`,
          color: "#64748b",
          position: "insideEndTop",
          fontSize: 11,
        },
        data: [{ yAxis: ceiling }],
      };
    }

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 56, right: 24, top: 56, bottom: 32 },
        legend: {
          top: 8,
          textStyle: { color: "#475569", fontSize: 11 },
          type: "scroll",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          valueFormatter: (v: number | null) =>
            v == null
              ? "—"
              : `${v.toLocaleString("ja-JP", { maximumFractionDigits: 3 })} ${unit}`,
        },
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#64748b" },
        },
        yAxis: {
          type: "value",
          name: unit,
          nameTextStyle: { color: "#475569", fontSize: 11 },
          axisLabel: { color: "#64748b" },
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        series: echartsSeries,
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [series, ceiling, unit]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="需給調整市場 6 商品 年間平均落札単価 比較チャート"
      style={{ height }}
      className="rounded-md border border-slate-200 bg-white"
    />
  );
}
