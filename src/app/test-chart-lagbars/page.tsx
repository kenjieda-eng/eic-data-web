import ChartLagBars from "@/components/ChartLagBars";
import Container from "@/components/Container";

export const metadata = {
  title: "ChartLagBars smoke test | EIC Data",
  description:
    "ChartLagBars のラグ相関スイープスモークテスト。LNG → JEPX 東京、0-12 ヶ月。",
};

export default function TestChartLagBarsPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-ink">ChartLagBars smoke test</h1>
      <p className="mt-2 text-subink">
        LNG (fuel-lng-jp-cif) → JEPX 東京 (jepx-spot-tokyo) のラグ相関スイープ、0-12 ヶ月、ピーク赤バー強調。
      </p>
      <div className="mt-6">
        <ChartLagBars leadId="fuel-lng-jp-cif" lagId="jepx-spot-tokyo" />
      </div>
    </Container>
  );
}
