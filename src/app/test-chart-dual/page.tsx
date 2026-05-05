import ChartDual from "@/components/ChartDual";
import Container from "@/components/Container";

export const metadata = {
  title: "ChartDual smoke test | EIC Data",
  description:
    "ChartDual の 2 軸描画スモークテスト。LNG ($/MMBtu) × JEPX 東京 (¥/kWh)。",
};

export default function TestChartDualPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-ink">ChartDual smoke test</h1>
      <p className="mt-2 text-subink">
        LNG ($/MMBtu) × JEPX 東京 (¥/kWh)、月次集約 + 共通月 alignMonthly。
      </p>
      <div className="mt-6">
        <ChartDual
          leftId="fuel-lng-jp-cif"
          rightId="jepx-spot-tokyo"
          leftTitle="日本 LNG 輸入価格（CIF）"
          rightTitle="JEPX 東京エリア スポット価格"
          leftAxisName="$/MMBtu"
          rightAxisName="¥/kWh"
        />
      </div>
    </Container>
  );
}
