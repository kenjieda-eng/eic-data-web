/**
 * N9 SEO 強化 (Day 6 Phase C, 2026-05-17): OG image 動的生成
 *
 * GET /api/og/<type>/<id>
 *   type: "catalog" | "insight" | "glossary"
 *   id  : indicator id / insight slug / glossary slug
 *
 * 1200x630 PNG (next/og ImageResponse、Edge runtime)
 * - catalog : 系列名 + 出典 + 最新 as-of
 * - insight : title + lede + tags
 * - glossary: 用語名 + description (先頭 120 文字)
 *
 * 設計ノート:
 *  - Node fs を使わないので fonts 配列は省略 (system default + 日本語は OS フォントに頼る)
 *    → SVG 描画なのでフォント未指定でも文字列は表示されるが、文字幅は環境依存
 *  - 不正な type/id は 400 を返す (DoS 防止: OG generation はそれなりに重い)
 *  - 1 時間 ISR (revalidate=3600) で過剰生成を防止、catalog 改訂頻度と整合
 */

import { ImageResponse } from "next/og";
import { fetchCatalog, getIndicatorById } from "@/lib/catalog";
import { GLOSSARY_TERMS } from "@/app/glossary/data";
import { INSIGHTS } from "@/lib/insights";
import {
  catalogCard,
  defaultCard,
  glossaryCard,
  insightCard,
  isValidOgType,
  type OgCard,
} from "@/lib/og-card";

export const runtime = "edge";
export const revalidate = 3600;

interface RouteParams {
  params: Promise<{ type: string; id: string }>;
}

async function buildOgCard(type: string, id: string): Promise<OgCard | null> {
  if (type === "catalog") {
    const catalog = await fetchCatalog();
    const ind = getIndicatorById(catalog, id);
    return ind ? catalogCard(ind) : null;
  }
  if (type === "insight") {
    const insight = INSIGHTS.find((i) => i.slug === id);
    return insight ? insightCard(insight) : null;
  }
  if (type === "glossary") {
    const term = GLOSSARY_TERMS.find((t) => t.slug === id);
    return term ? glossaryCard(term) : null;
  }
  if (type === "default") {
    return defaultCard(id);
  }
  return null;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { type, id } = await params;
  if (!isValidOgType(type) || !id) {
    return new Response("Bad Request", { status: 400 });
  }
  const card = await buildOgCard(type, id);
  if (!card) {
    return new Response("Not Found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f8fafc",
          padding: "60px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "#047857",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 700,
              color: "#047857",
              letterSpacing: -0.5,
            }}
          >
            EIC Data
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 20,
              color: "#475569",
              backgroundColor: "#ecfdf5",
              borderRadius: 999,
              padding: "8px 18px",
            }}
          >
            {card.badge}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.2,
              letterSpacing: -1,
            }}
          >
            {card.title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#475569",
              lineHeight: 1.5,
            }}
          >
            {card.body}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex" }}>{card.meta}</div>
          <div style={{ display: "flex" }}>data.eic-jp.org</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
