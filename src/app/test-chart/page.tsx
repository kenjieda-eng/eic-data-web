import ChartLine from "@/components/ChartLine";
import Container from "@/components/Container";

export const metadata = {
  title: "ChartLine テスト | EIC Data",
  description:
    "Phase A Day 3 — ECharts ラッパー Component の動作確認ページ。",
};

export default function TestChartPage() {
  return (
    <Container className="py-12 space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-ink">
          ChartLine Component テスト
        </h1>
        <p className="mt-2 text-sm text-subink">
          Phase A Day 3 — ECharts ラッパー Component の動作確認。
          3 系列を同一ページで描画し、catalog → CSV → ECharts の経路を検証する。
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-ink">
          JEPX 東京（日次, ¥/kWh）
        </h2>
        <ChartLine id="jepx-spot-tokyo" color="#047857" />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-ink">
          LNG 日本 CIF（月次, $/MMBtu）
        </h2>
        <ChartLine id="fuel-lng-jp-cif" color="#a16207" />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-ink">
          米国 10 年金利（日次, %）
        </h2>
        <ChartLine id="us-treasury-10y" color="#dc2626" />
      </section>
    </Container>
  );
}
