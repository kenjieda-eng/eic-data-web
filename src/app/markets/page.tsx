import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "日本電力 3 大市場 — JEPX / 容量市場 / 需給調整市場 | EIC Data",
  description:
    "日本の電力市場は kWh 価値 (JEPX スポット)・kW 価値の長期確保 (容量市場)・即時調整力 (需給調整市場、EPRX) の 3 階建てで構成される。本セクションは各市場の編集ページへの入口。",
};

interface MarketEntry {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  href: string | null;
  hrefLabel: string;
  status: "live" | "future";
  axis: string;
  cadence: string;
  operator: string;
}

const MARKETS: MarketEntry[] = [
  {
    key: "jepx",
    title: "JEPX スポット市場",
    subtitle: "kWh 価値 (実電力量)",
    description:
      "前日 1 日先・48 コマの卸電力スポット価格。日々の燃料費・需要・再エネ出力が直接反映される、最もボラタイルな市場。",
    href: "/catalog?domain=electricity",
    hrefLabel: "catalog (electricity ドメインで絞り込み)",
    status: "live",
    axis: "kWh 価値",
    cadence: "日次・前日約定",
    operator: "JEPX (日本卸電力取引所)",
  },
  {
    key: "capacity",
    title: "容量市場",
    subtitle: "kW 価値 (長期供給力)",
    description:
      "実需給年度の 4 年前にメインオークションで kW を年 1 回約定する長期市場。OCCTO 運営。約定価格は小売料金経由で需要家負担。",
    href: "/insight/capacity-market-5-year-trends",
    hrefLabel: "Insight #61 容量市場 6 年推移",
    status: "live",
    axis: "kW 価値",
    cadence: "4 年先・年 1 回",
    operator: "OCCTO",
  },
  {
    key: "balancing",
    title: "需給調整市場",
    subtitle: "調整力 (ΔkW、即時の周波数制御)",
    description:
      "一般送配電事業者が周波数制御に必要な調整力を広域・公平に調達する全国共通市場。EPRX 運営、年次取りまとめが公表される。",
    href: "/markets/balancing",
    hrefLabel: "/markets/balancing — 需給調整市場 (本サイト)",
    status: "live",
    axis: "ΔkW (調整力)",
    cadence: "即時 (秒〜45 分)",
    operator: "EPRX (送配電事業者間の共通市場)",
  },
];

export default function MarketsHubPage() {
  return (
    <Container size="wide" className="py-10">
      <header className="mb-8">
        <p className="text-xs text-faint uppercase tracking-wider">ホーム ／ 市場</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          日本電力の 3 大市場
        </h1>
        <p className="mt-3 text-base text-subink leading-relaxed">
          日本の電力市場は <strong className="text-ink">kWh 価値 (実電力量)</strong> ・
          <strong className="text-ink"> kW 価値の長期確保</strong> ・
          <strong className="text-ink"> 即時の調整力 (ΔkW)</strong>{" "}
          という 3 つの時間軸に分かれて取引されています。本セクションは各市場の編集ページへの入口です。
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {MARKETS.map((m) => (
          <li
            key={m.key}
            className="rounded-md border border-slate-200 bg-white p-5 flex flex-col gap-3"
          >
            <header>
              <h2 className="text-xl font-semibold text-ink">{m.title}</h2>
              <p className="text-sm text-emerald-700">{m.subtitle}</p>
            </header>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-subink">
              <dt className="text-faint">取引対象</dt>
              <dd>{m.axis}</dd>
              <dt className="text-faint">時間軸</dt>
              <dd>{m.cadence}</dd>
              <dt className="text-faint">運営</dt>
              <dd>{m.operator}</dd>
            </dl>
            <p className="text-sm text-subink leading-relaxed">{m.description}</p>
            {m.href ? (
              <Link
                href={m.href}
                className="mt-auto inline-flex items-center text-sm text-emerald-700 underline hover:text-emerald-900"
              >
                {m.hrefLabel} →
              </Link>
            ) : (
              <span className="mt-auto text-sm text-faint">{m.hrefLabel}</span>
            )}
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-subink space-y-2">
        <h2 className="text-lg font-semibold text-ink">3 大市場の関係</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            発電事業者の収益は <strong className="text-ink">kWh 価値 (JEPX)</strong> + <strong className="text-ink">kW 価値 (容量市場)</strong> + <strong className="text-ink">ΔkW 価値 (需給調整市場)</strong> の合算で構成される。
          </li>
          <li>
            再エネ大量導入による短期ボラティリティ拡大は需給調整市場の取引高を押し上げ、ピーク需要対応の確実性は容量市場価格を押し上げる。
          </li>
          <li>
            時間軸が異なるため、3 市場の価格は同時に動くとは限らない (例: JEPX が低いときでも、容量市場は逼迫見通しを反映して上昇しうる)。
          </li>
        </ul>
      </section>
    </Container>
  );
}
