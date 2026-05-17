/**
 * N8 iframe 埋め込みウィジェット — /embed/<id>
 *
 * Phase C Day 6 (2026-05-17) で実装。
 * bess-net + pps-net 等の業界フロントが
 *   <iframe src="https://data.eic-jp.org/embed/jepx-spot-tokyo" width="400" height="300" />
 * で個別系列の「最新値 + 過去 30 日チャート + 出典」を埋め込めるようにする。
 *
 * - グローバル layout.tsx の <html>/<body> 配下に置かれるが
 *   <div class="embed-page"> を root に出して globals.css の :has() ルールで
 *   header/footer を非表示にしている (iframe-safe な見た目)
 * - サーバーコンポーネント、クライアント JS なし、SVG sparkline をその場で生成
 * - X-Frame-Options は default の SAMEORIGIN を上書きする必要があるため
 *   next.config.ts 側で /embed/* のみ ALLOW にする (本ファイルで設定はできない)
 *   → 既定の SAMEORIGIN でも自社ドメインからの埋め込みは可、外部ドメイン許可は
 *     Vercel headers config で別途対応 (本実装スコープ外、Day 6 続きで)
 * - 1 時間 ISR (catalog/series 同様、Day 3 公開 API と整合)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCatalog, getIndicatorById } from "@/lib/catalog";
import { fetchSeries, type SeriesPoint } from "@/lib/series";
import {
  buildSparkline,
  formatEmbedNumber,
  type Sparkline,
} from "@/lib/embed-sparkline";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${id} 埋め込みウィジェット — EIC Data`,
    description: `${id} の最新値と過去 30 日チャートを埋め込み表示。`,
    robots: { index: false, follow: false },
  };
}

const SVG_W = 360;
const SVG_H = 100;

const TREND_BADGE: Record<Sparkline["trend"], { label: string; color: string }> = {
  up: { label: "▲ 上昇", color: "#b91c1c" },
  down: { label: "▼ 下落", color: "#0369a1" },
  flat: { label: "→ ほぼ横ばい", color: "#475569" },
  unknown: { label: "—", color: "#94a3b8" },
};

export default async function EmbedPage({ params }: PageProps) {
  const { id } = await params;
  const catalog = await fetchCatalog();
  const indicator = getIndicatorById(catalog, id);
  if (!indicator) notFound();

  let points: SeriesPoint[] = [];
  let seriesError: string | null = null;
  try {
    const series = await fetchSeries(id);
    // 直近 30 観測 (頻度に依らない: 日次なら 30 日、月次なら 30 か月)
    points = series.points.slice(-30);
  } catch (e) {
    seriesError = e instanceof Error ? e.message : String(e);
  }
  const spark = buildSparkline(points, { width: SVG_W, height: SVG_H, padding: 4 });
  const lastDate = points.length > 0 ? points[points.length - 1].date : null;
  const accessUrl = `https://data.eic-jp.org/catalog/${indicator.id}`;
  const badge = TREND_BADGE[spark?.trend ?? "unknown"];

  return (
    <div className="embed-page" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "0 auto",
          padding: 12,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          boxSizing: "border-box",
          color: "#1e293b",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <strong style={{ fontSize: 13, color: "#047857" }}>EIC Data</strong>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{indicator.id}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>
          {indicator.name}
        </div>
        {spark && spark.last !== null ? (
          <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
              {formatEmbedNumber(spark.last, indicator.unit)}
            </span>
            <span style={{ fontSize: 11, color: badge.color }}>{badge.label}</span>
          </div>
        ) : (
          <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 11 }}>
            {seriesError ? "データ取得に失敗" : "データなし"}
          </div>
        )}
        {spark && (
          <svg
            role="img"
            aria-label={`${indicator.name} 直近 ${points.length} 観測の推移`}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ width: "100%", height: "auto", marginTop: 6, display: "block" }}
          >
            <path d={spark.path} fill="none" stroke="#10b981" strokeWidth={1.6} />
          </svg>
        )}
        <div style={{ marginTop: 6, color: "#64748b", fontSize: 10 }}>
          出典: {indicator.source_name} ／ ライセンス: {indicator.license}
          {lastDate && (
            <>
              <br />
              as-of {lastDate} ／ 頻度 {indicator.frequency}
            </>
          )}
        </div>
        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
          }}
        >
          <Link
            href={accessUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#047857", textDecoration: "none" }}
          >
            詳細を見る →
          </Link>
          <span style={{ color: "#94a3b8" }}>Powered by EIC Data</span>
        </div>
      </div>
    </div>
  );
}
