"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  fetchSeriesBatch,
  type SeriesBundle,
} from "@/lib/series-batch";
import {
  buildHeatmapData,
  type HeatmapMatrix,
} from "@/lib/heatmap-data";

echarts.use([
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

const REGION_LABELS: Record<string, string> = {
  hokkaido: "札幌",
  tohoku: "仙台",
  tokyo: "東京",
  chubu: "名古屋",
  kansai: "大阪",
  chugoku: "広島",
  shikoku: "高松",
  kyushu: "福岡",
  hokuriku: "金沢",
};

function regionFromId(id: string): string {
  const parts = id.split("-");
  const slug = parts[parts.length - 1];
  return REGION_LABELS[slug] ?? slug;
}

const COLOR_SCHEMES: Record<string, string[]> = {
  sequential: ["#0066cc", "#00cc66", "#ffcc00", "#cc3300"],
  diverging: ["#0066cc", "#cccccc", "#cc3300"],
};

export interface ChartHeatmapProps {
  indicatorIds: string[];
  months?: number;
  colorScheme?: "sequential" | "diverging";
  unit?: string;
  title?: string;
  height?: number;
}

export default function ChartHeatmap({
  indicatorIds,
  months = 36,
  colorScheme = "sequential",
  unit,
  title,
  height = 360,
}: ChartHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [bundles, setBundles] = useState<Record<string, SeriesBundle> | null>(
    null,
  );
  const [matrix, setMatrix] = useState<HeatmapMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);

  const idsKey = useMemo(() => indicatorIds.join("|"), [indicatorIds]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setBundles(null);
    setMatrix(null);
    fetchSeriesBatch(indicatorIds)
      .then((b) => {
        if (cancelled) return;
        setBundles(b);
        setMatrix(buildHeatmapData(b, indicatorIds, months));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load series");
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey, months, indicatorIds]);

  useEffect(() => {
    if (!containerRef.current || !matrix || !bundles) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: "canvas",
      });
    }

    const yLabels = matrix.locationIds.map(regionFromId);
    const headBundle = bundles[matrix.locationIds[0]];
    const displayUnit = unit ?? headBundle?.meta.unit ?? "";

    const data = matrix.cells
      .filter((c) => c.value !== null && Number.isFinite(c.value as number))
      .map((c) => [c.xIndex, c.yIndex, c.value as number]);

    chartRef.current.setOption(
      {
        animation: false,
        grid: { left: 80, right: 32, top: title ? 48 : 24, bottom: 80 },
        title: title
          ? {
              text: title,
              left: "center",
              top: 8,
              textStyle: {
                color: "#0f172a",
                fontSize: 14,
                fontWeight: "normal",
              },
            }
          : undefined,
        tooltip: {
          position: "top",
          formatter: (p: { value: [number, number, number] }) => {
            const [x, y, v] = p.value;
            const valStr = v.toLocaleString("ja-JP", {
              maximumFractionDigits: 2,
            });
            return `${yLabels[y]} / ${matrix.months[x]}<br/><strong>${valStr} ${displayUnit}</strong>`;
          },
        },
        xAxis: {
          type: "category",
          data: matrix.months,
          axisLabel: {
            color: "#64748b",
            fontSize: 10,
            rotate: 45,
            interval: Math.max(0, Math.floor(matrix.months.length / 18)),
          },
          splitArea: { show: false },
        },
        yAxis: {
          type: "category",
          data: yLabels,
          axisLabel: { color: "#475569" },
          splitArea: { show: false },
        },
        visualMap: {
          min: matrix.min,
          max: matrix.max,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: 8,
          inRange: { color: COLOR_SCHEMES[colorScheme] },
          textStyle: { color: "#475569" },
        },
        series: [
          {
            name: title ?? "",
            type: "heatmap",
            data,
            emphasis: {
              itemStyle: { borderColor: "#0f172a", borderWidth: 1 },
            },
            progressive: 0,
          },
        ],
      },
      { notMerge: true },
    );

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [matrix, bundles, colorScheme, unit, title]);

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

  if (!matrix || !bundles) {
    return (
      <div
        aria-busy="true"
        className="flex items-center justify-center rounded-md border border-slate-200 bg-paper text-sm text-faint"
        style={{ height }}
      >
        Loading {indicatorIds.length} 系列…
      </div>
    );
  }

  const headMeta = bundles[indicatorIds[0]]?.meta;

  return (
    <figure className="rounded-md border border-slate-200 bg-white p-2">
      <figcaption className="mb-1 px-2 text-xs text-subink">
        {headMeta && (
          <>
            <strong className="text-ink">
              {title ?? `${indicatorIds.length} 地点 × ${matrix.months.length} ヶ月`}
            </strong>
            （出典:{" "}
            <a
              href={headMeta.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-800"
            >
              {headMeta.source_name}
            </a>
            ／as-of {headMeta.observation_cutoff}／{headMeta.license}）
          </>
        )}
      </figcaption>
      <div
        ref={containerRef}
        role="img"
        aria-label={`${indicatorIds.length} 地点 × ${matrix.months.length} ヶ月のヒートマップ`}
        style={{ height }}
      />
    </figure>
  );
}
