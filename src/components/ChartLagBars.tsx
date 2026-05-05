"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { fetchSeries, type SeriesMeta } from "@/lib/series";
import { aggregateMonthly, shiftMonths } from "@/lib/series-batch";
import { pearsonCorrelation } from "@/lib/derived";

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  CanvasRenderer,
]);

export interface ChartLagBarsProps {
  leadId: string;
  lagId: string;
  maxLag?: number;
  highlightPeak?: boolean;
  height?: number;
  peakColor?: string;
  defaultColor?: string;
}

interface LagResult {
  lagMonths: number;
  r: number;
}

interface LagData {
  leadMeta: SeriesMeta;
  lagMeta: SeriesMeta;
  results: LagResult[];
  peakIndex: number;
}

export default function ChartLagBars({
  leadId,
  lagId,
  maxLag = 12,
  highlightPeak = true,
  height = 320,
  peakColor = "#dc2626",
  defaultColor = "#0ea5e9",
}: ChartLagBarsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<LagData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    Promise.all([fetchSeries(leadId), fetchSeries(lagId)])
      .then(([leadRaw, lagRaw]) => {
        if (cancelled) return;
        const leadMonthly = aggregateMonthly(leadRaw.points);
        const lagMonthly = aggregateMonthly(lagRaw.points);
        const results: LagResult[] = [];
        for (let m = 0; m <= maxLag; m++) {
          const shifted = shiftMonths(leadMonthly, m);
          const r = pearsonCorrelation(shifted, lagMonthly);
          if (r === null) continue;
          results.push({ lagMonths: m, r });
        }
        if (results.length === 0) {
          setError("No valid correlations computed");
          return;
        }
        let peakIndex = 0;
        for (let i = 1; i < results.length; i++) {
          if (Math.abs(results[i].r) > Math.abs(results[peakIndex].r)) {
            peakIndex = i;
          }
        }
        setData({
          leadMeta: leadRaw.meta,
          lagMeta: lagRaw.meta,
          results,
          peakIndex,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load series");
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, lagId, maxLag]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 56, right: 24, top: 32, bottom: 56 },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params: { dataIndex: number; value: number }[]) => {
            const p = params[0];
            const r = data.results[p.dataIndex];
            return `lag ${r.lagMonths} ヶ月<br/>r = ${r.r.toFixed(3)}${
              p.dataIndex === data.peakIndex ? "（ピーク）" : ""
            }`;
          },
        },
        xAxis: {
          type: "category",
          data: data.results.map((r) => `${r.lagMonths}m`),
          name: "lag（先行月数）",
          nameLocation: "middle",
          nameGap: 32,
          nameTextStyle: { color: "#475569" },
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisLabel: { color: "#64748b" },
        },
        yAxis: {
          type: "value",
          name: "r（ピアソン相関）",
          nameTextStyle: { color: "#475569" },
          min: -1,
          max: 1,
          axisLabel: {
            color: "#64748b",
            formatter: (v: number) => v.toFixed(2),
          },
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        series: [
          {
            type: "bar",
            name: "相関係数",
            data: data.results.map((r, i) => ({
              value: r.r,
              itemStyle: {
                color:
                  highlightPeak && i === data.peakIndex
                    ? peakColor
                    : defaultColor,
              },
            })),
            label: {
              show: true,
              position: "top",
              formatter: (p: { value: number }) => p.value.toFixed(2),
              fontSize: 10,
              color: "#475569",
            },
            barWidth: "60%",
          },
        ],
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, highlightPeak, peakColor, defaultColor]);

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
        Loading lag correlation: {leadId} → {lagId}…
      </div>
    );
  }

  const peak = data.results[data.peakIndex];

  return (
    <figure className="rounded-md border border-slate-200 bg-white p-2">
      <figcaption className="mb-1 px-2 text-xs text-subink">
        <span className="block">
          <strong className="text-ink">
            {data.leadMeta.name}（先行）→ {data.lagMeta.name}（遅行）
          </strong>
          のラグ相関スイープ（0–{maxLag} ヶ月、月次ピアソン）
        </span>
        <span className="block">
          ピーク:{" "}
          <strong style={{ color: peakColor }}>
            lag {peak.lagMonths} ヶ月（r = {peak.r.toFixed(3)}）
          </strong>
          ／出典:{" "}
          <a
            href={data.leadMeta.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            {data.leadMeta.source_name}
          </a>
          ＋
          <a
            href={data.lagMeta.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            {data.lagMeta.source_name}
          </a>
        </span>
      </figcaption>
      <div
        ref={containerRef}
        role="img"
        aria-label={`${data.leadMeta.name} を 0-${maxLag} ヶ月先行させた時の ${data.lagMeta.name} とのラグ相関スイープ。ピークは lag ${peak.lagMonths} ヶ月で r = ${peak.r.toFixed(3)}`}
        style={{ height }}
      />
    </figure>
  );
}
