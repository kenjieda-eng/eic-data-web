import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { REGIONS } from "@/lib/region-coords";
import MapClient from "./MapClient";

export const metadata: Metadata = {
  title: "9 エリア地図ビュー — EIC Data",
  description:
    "JEPX 9 エリア (北海道/東北/東京/中部/北陸/関西/中国/四国/九州) の地理的サマリー。各ピンから Insight #1-#10 (気温 × 電力価格 シリーズ) へ即遷移、9 地域の北極星「地域差の構造」を 1 ページで俯瞰。",
};

export default function MapPage() {
  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 9 エリア地図ビュー"}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          9 エリア地図ビュー ／ <code className="text-emerald-700">/map</code>
        </h1>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          JEPX{" "}
          <strong className="text-ink tabular-nums">{REGIONS.length}</strong>{" "}
          エリア (北海道 / 東北 / 東京 / 中部 / 北陸 / 関西 / 中国 / 四国 / 九州) の
          地理的サマリー。各ピンを<strong className="text-ink">クリック</strong>すると
          該当 Insight (気温 × 電力価格シリーズ #1-#10) の個別ページに遷移します。
        </p>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          地域別の電源構成 (原発再稼働 / 太陽光導入 / 水力ベースロード) と気象パターン
          (寒冷 / 豪雪 / 猛暑) が、JEPX 卸価格にどう刻印されているかを 9 ノードで俯瞰する象徴的画面。
        </p>
      </header>

      <MapClient regions={REGIONS} />

      <p className="mt-6 text-[11px] text-faint">
        投影: viewBox 0 0 500 700 への簡易 1 次投影 (lng→x, lat→y inverted、緯度経度→
        SVG 座標)。9 region 輪郭は ellipse 近似 (recognition 用)。実際の境界は
        JEPX エリア定義 (10 エリア中 沖縄を除いた 9 つ) に準拠。
      </p>
    </Container>
  );
}
