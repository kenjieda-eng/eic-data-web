import Container from "@/components/Container";
import {
  fetchYenLng,
  fetchRateSpread,
  pearsonCorrelation,
} from "@/lib/derived";
import { fetchSeries } from "@/lib/series";

export const metadata = {
  title: "派生系列テスト | EIC Data",
  description:
    "Phase A Day 4 — series-batch + derived の動作確認ページ。",
};

export const revalidate = 86400;

export default async function TestDerivedPage() {
  const yenLng = await fetchYenLng();
  const usJpSpread = await fetchRateSpread(
    "us-treasury-10y",
    "jgb-10y-yield",
    "日米 10 年金利差 (US 10y - JGB 10y)",
  );

  const usdjpy = await fetchSeries("fx-usdjpy-monthly-avg");
  const r = pearsonCorrelation(yenLng.points, usdjpy.points);

  return (
    <Container className="py-12 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-ink">派生系列テスト</h1>
        <p className="mt-2 text-sm text-subink">
          Phase A Day 4 — series-batch（並列 fetch・月次集約・align）と
          derived（円建て LNG / 金利差 / 相関）の動作確認。
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-ink">{yenLng.meta.name}</h2>
        <p className="text-xs text-subink">
          depends_on: {yenLng.meta.depends_on.join(", ")} ・{" "}
          {yenLng.points.length} 月次データ点 ・ 単位: {yenLng.meta.unit}
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-100 p-2 text-xs text-ink">
          最新 5 月: {JSON.stringify(yenLng.points.slice(-5), null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">
          {usJpSpread.meta.name}
        </h2>
        <p className="text-xs text-subink">
          depends_on: {usJpSpread.meta.depends_on.join(", ")} ・{" "}
          {usJpSpread.points.length} 月次データ点 ・ 単位:{" "}
          {usJpSpread.meta.unit}
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-100 p-2 text-xs text-ink">
          最新 5 月: {JSON.stringify(usJpSpread.points.slice(-5), null, 2)}
        </pre>
      </section>

      <section className="rounded-md border border-slate-200 bg-emerald-50 p-4">
        <h2 className="text-lg font-semibold text-ink">月次相関</h2>
        <p className="text-sm text-ink">
          円建て LNG × USD/JPY の月次ピアソン相関:{" "}
          <strong className="text-emerald-700">
            r = {r?.toFixed(3) ?? "—"}
          </strong>
        </p>
        <p className="mt-2 text-xs text-subink">
          → モック側の Insight #16 / #37 / #39 と同じ計算ロジック。
          期待値: r ≈ 0.85 前後（円安時に円建て輸入物価が上がる強い同方向相関）。
        </p>
      </section>
    </Container>
  );
}
