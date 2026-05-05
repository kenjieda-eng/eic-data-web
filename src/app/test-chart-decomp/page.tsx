import ChartDecomp from "@/components/ChartDecomp";
import Container from "@/components/Container";

export const metadata = {
  title: "ChartDecomp smoke test | EIC Data",
  description:
    "ChartDecomp 加法 3 要因分解スモークテスト。LNG × USD/JPY 基準月 2020-12。",
};

export default function TestChartDecompPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-ink">ChartDecomp smoke test</h1>
      <p className="mt-2 text-subink">
        円建て LNG = LNG × USD/JPY を加法 3 要因分解（基準月 2020-12）。LNG 要因（青） / 円安要因（オレンジ） / 相乗効果（灰）。
      </p>
      <div className="mt-6">
        <ChartDecomp
          factorAId="fuel-lng-jp-cif"
          factorBId="fx-usdjpy-monthly-avg"
          baseYM="2020-12"
          labelA="LNG 価格要因"
          labelB="円安要因"
          labelInteraction="相乗効果"
          unit="円/MMBtu"
        />
      </div>
    </Container>
  );
}
