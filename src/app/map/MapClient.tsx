"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PROJECTION,
  REGION_SHAPES,
  regionPin,
  type RegionMeta,
} from "@/lib/region-coords";

const WIDTH = PROJECTION.width;
const HEIGHT = PROJECTION.height;

const PIN_R = 12;
const PIN_R_HOVER = 16;

export default function MapClient({ regions }: { regions: RegionMeta[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    regions.find((r) => r.slug === "tokyo")?.slug ?? regions[0]?.slug ?? "",
  );

  const selected =
    regions.find((r) => r.slug === selectedSlug) ?? regions[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* SVG 地図 */}
      <div
        className="rounded-md border border-slate-200 bg-white"
        style={{ overflow: "hidden" }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          role="img"
          aria-label="日本 9 エリア地図 (北海道 / 東北 / 東京 / 中部 / 北陸 / 関西 / 中国 / 四国 / 九州)"
          style={{ background: "#f8fafc", maxHeight: 720 }}
        >
          {/* 各 region の輪郭 (ellipse) */}
          {regions.map((r) => {
            const shape = REGION_SHAPES[r.slug];
            if (!shape) return null;
            const active = r.slug === selectedSlug || r.slug === hovered;
            return (
              <ellipse
                key={`shape-${r.slug}`}
                cx={shape.cx}
                cy={shape.cy}
                rx={shape.rx}
                ry={shape.ry}
                fill={r.color}
                fillOpacity={active ? 0.25 : 0.12}
                stroke={r.color}
                strokeOpacity={active ? 0.8 : 0.45}
                strokeWidth={active ? 2 : 1}
              />
            );
          })}

          {/* 9 ピン + ラベル */}
          {regions.map((r) => {
            const { x, y } = regionPin(r);
            const hover = r.slug === hovered;
            const active = r.slug === selectedSlug || hover;
            const radius = hover ? PIN_R_HOVER : PIN_R;
            return (
              <g
                key={`pin-${r.slug}`}
                role="button"
                tabIndex={0}
                aria-label={`${r.ja} → Insight #${r.insightNumber}`}
                onClick={() => setSelectedSlug(r.slug)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedSlug(r.slug);
                  }
                }}
                onMouseEnter={() => setHovered(r.slug)}
                onMouseLeave={() => setHovered((cur) => (cur === r.slug ? null : cur))}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={r.color}
                  stroke="#ffffff"
                  strokeWidth={active ? 3 : 2}
                />
                <text
                  x={x}
                  y={y - radius - 6}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={600}
                  fill="#1f2937"
                  pointerEvents="none"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeLinejoin="round"
                >
                  {r.ja}
                </text>
                <text
                  x={x}
                  y={y + radius + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#64748b"
                  pointerEvents="none"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                >
                  #{r.insightNumber} {r.city}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* サイドパネル: 選択 region 詳細 + 凡例 */}
      <aside className="space-y-4">
        <section
          aria-label="選択 region 詳細"
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-faint">
            選択中のエリア
          </div>
          {selected ? (
            <>
              <h2 className="mt-1 text-lg font-semibold text-ink">
                {selected.ja}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: selected.color }}
                  aria-hidden
                />
                <span>JMA 気象官署: {selected.city}</span>
                <span aria-hidden>／</span>
                <span className="font-mono">{selected.slug}</span>
                <span aria-hidden>／</span>
                <span>
                  ({selected.lat.toFixed(2)}°N, {selected.lng.toFixed(2)}°E)
                </span>
              </div>
              <p className="mt-3 text-[13px] text-ink leading-relaxed">
                {selected.hook}
              </p>
              <Link
                href={`/insight/${selected.insightSlug}`}
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                📊 Insight #{selected.insightNumber} を開く →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-subink">
              ピンをクリックして詳細を表示。
            </p>
          )}
        </section>

        <section
          aria-label="操作"
          className="rounded-md border border-slate-200 bg-slate-50 p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            操作
          </div>
          <ul className="space-y-1 text-[12px] text-subink leading-relaxed">
            <li>
              <strong className="text-ink">クリック</strong>: ピン選択 → サイドパネルで詳細
            </li>
            <li>
              <strong className="text-ink">ホバー</strong>: ピン拡大ハイライト
            </li>
            <li>
              <strong className="text-ink">Insight ボタン</strong>: 該当 Insight 個別ページへ遷移
            </li>
            <li>
              <strong className="text-ink">配色</strong>: 9 region 各色 (用語集グラフ palette 系)
            </li>
          </ul>
        </section>
      </aside>

      {/* 下部: 9 region KPI カードグリッド */}
      <div className="lg:col-span-2">
        <h2 className="mt-4 mb-3 text-base md:text-lg font-semibold text-ink">
          9 エリア一覧
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">
          {regions.map((r) => {
            const active = r.slug === selectedSlug;
            return (
              <button
                type="button"
                key={`card-${r.slug}`}
                onClick={() => setSelectedSlug(r.slug)}
                aria-pressed={active}
                className={`text-left rounded-md border bg-white p-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                  active
                    ? "border-emerald-500 ring-1 ring-emerald-200"
                    : "border-slate-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: r.color }}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold text-ink">
                      {r.ja}
                    </span>
                  </span>
                  <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-faint tabular-nums">
                    #{r.insightNumber}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-subink leading-relaxed">
                  {r.hook}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-faint">JMA {r.city}</span>
                  <Link
                    href={`/insight/${r.insightSlug}`}
                    className="text-emerald-700 underline hover:text-emerald-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Insight #{r.insightNumber} →
                  </Link>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
