"use client";

import { useEffect, useState } from "react";
import { fetchSeries, type SeriesPoint } from "@/lib/series";
import BalancingProductsChart, {
  type BalancingProductSeries,
} from "@/app/markets/balancing/BalancingProductsChart";

const PRODUCT_IDS = [
  "balancing-price-primary",
  "balancing-price-secondary-1",
  "balancing-price-secondary-2",
  "balancing-price-tertiary-1",
  "balancing-price-tertiary-2",
  "balancing-price-composite",
] as const;

type ProductId = (typeof PRODUCT_IDS)[number];

const PRODUCT_META: Record<ProductId, { label: string; color: string }> = {
  "balancing-price-primary": { label: "一次調整力", color: "#dc2626" },
  "balancing-price-secondary-1": { label: "二次調整力①", color: "#ea580c" },
  "balancing-price-secondary-2": { label: "二次調整力②", color: "#d97706" },
  "balancing-price-tertiary-1": { label: "三次調整力①", color: "#0891b2" },
  "balancing-price-tertiary-2": { label: "三次調整力②", color: "#047857" },
  "balancing-price-composite": { label: "複合商品", color: "#7c3aed" },
};

const CEILING_PRICE = 19.51;
const UNIT = "円/ΔkW・30分";

export default function BalancingProductsCompareChart() {
  const [series, setSeries] = useState<BalancingProductSeries[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(PRODUCT_IDS.map((id) => fetchSeries(id)))
      .then((results) => {
        if (cancelled) return;
        const built: BalancingProductSeries[] = results.map((r, i) => {
          const id = PRODUCT_IDS[i];
          const meta = PRODUCT_META[id];
          return {
            id,
            name: meta.label,
            color: meta.color,
            points: r.points as SeriesPoint[],
          };
        });
        setSeries(built);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load series");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div
        role="alert"
        className="flex h-[360px] items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-sm text-rose-700"
      >
        ⚠️ {error}
      </div>
    );
  }
  if (!series) {
    return (
      <div
        aria-busy="true"
        className="flex h-[360px] items-center justify-center rounded-md border border-slate-200 bg-paper text-sm text-faint"
      >
        Loading 需給調整市場 6 系列…
      </div>
    );
  }
  return (
    <figure className="rounded-md border border-slate-200 bg-white p-2">
      <figcaption className="mb-1 px-2 text-xs text-subink">
        <strong className="text-ink">需給調整市場 6 商品 年間平均落札単価</strong>
        （出典:{" "}
        <a
          href="https://www.eprx.or.jp/information/summary.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          電力需給調整力取引所 (EPRX)
        </a>
        ／単位 {UNIT}／参照線 上限価格 {CEILING_PRICE} {UNIT}）
      </figcaption>
      <BalancingProductsChart
        series={series}
        ceiling={CEILING_PRICE}
        unit={UNIT}
      />
    </figure>
  );
}
