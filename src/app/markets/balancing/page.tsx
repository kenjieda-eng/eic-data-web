import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import ChartLine from "@/components/ChartLine";
import { fetchCatalog, getIndicatorById, slaStatusOf, type Indicator } from "@/lib/catalog";
import { fetchSeries, type SeriesPoint } from "@/lib/series";
import BalancingProductsChart, {
  type BalancingProductSeries,
} from "./BalancingProductsChart";

export const revalidate = 86400;

const PRODUCT_IDS = [
  "balancing-price-primary",
  "balancing-price-secondary-1",
  "balancing-price-secondary-2",
  "balancing-price-tertiary-1",
  "balancing-price-tertiary-2",
  "balancing-price-composite",
] as const;

// 商品ごとの色 + 表示用短縮ラベル + 応動時間 (設計 §3 の階層図とチャート凡例に共通使用)
const PRODUCT_META: Record<
  (typeof PRODUCT_IDS)[number],
  { label: string; short: string; color: string; response: string; role: string }
> = {
  "balancing-price-primary": {
    label: "一次調整力",
    short: "一次",
    color: "#dc2626",
    response: "10 秒以内",
    role: "GF (ガバナフリー)",
  },
  "balancing-price-secondary-1": {
    label: "二次調整力①",
    short: "二次①",
    color: "#ea580c",
    response: "5 分以内",
    role: "LFC (負荷周波数制御)",
  },
  "balancing-price-secondary-2": {
    label: "二次調整力②",
    short: "二次②",
    color: "#d97706",
    response: "5 分以内",
    role: "LFC",
  },
  "balancing-price-tertiary-1": {
    label: "三次調整力①",
    short: "三次①",
    color: "#0891b2",
    response: "15 分以内",
    role: "EDC (経済負荷配分)",
  },
  "balancing-price-tertiary-2": {
    label: "三次調整力②",
    short: "三次②",
    color: "#047857",
    response: "45 分以内",
    role: "再エネ予測誤差対応",
  },
  "balancing-price-composite": {
    label: "複合商品",
    short: "複合",
    color: "#7c3aed",
    response: "—",
    role: "一次〜二次の合成",
  },
};

// EPRX 年次取りまとめにおける上限価格 (円/ΔkW・30分)。
// 商品単位の上限は微差があるが、参照線として 19.51 を採用 (設計 §3、ナギ確認)。
const CEILING_PRICE = 19.51;

interface ProductData {
  indicator: Indicator;
  points: SeriesPoint[];
}

interface PageData {
  products: ProductData[];
  observationCutoff: string;
  updatedAt: string;
}

async function loadPageData(): Promise<PageData> {
  const catalog = await fetchCatalog();
  const fetched = await Promise.all(
    PRODUCT_IDS.map(async (id) => {
      const indicator = getIndicatorById(catalog, id);
      if (!indicator) throw new Error(`catalog missing series: ${id}`);
      const { points } = await fetchSeries(id);
      return { indicator, points };
    }),
  );
  const observationCutoff = fetched
    .map((p) => p.indicator.observation_cutoff)
    .sort()
    .at(-1) as string;
  const updatedAt = fetched
    .map((p) => p.indicator.updated_at)
    .sort()
    .at(-1) as string;
  return { products: fetched, observationCutoff, updatedAt };
}

function formatPrice(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("ja-JP", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function lastTwoYears(points: SeriesPoint[]): { fy2024: number | null; fy2025: number | null } {
  const m = new Map(points.map((p) => [p.date, p.value]));
  return {
    fy2024: m.get("2024-04-01") ?? null,
    fy2025: m.get("2025-04-01") ?? null,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "需給調整市場 (EPRX) — 6 商品の落札単価と JEPX 連動 | EIC Data";
  const description =
    "電力需給調整力取引所 (EPRX) の年次取りまとめより、需給調整市場 6 商品 (一次・二次①②・三次①②・複合) の年間平均落札単価を可視化。JEPX (kWh 価値)・容量市場 (kW 価値の長期確保) と並ぶ日本電力 3 大市場のうち、本ページは「即時調整力」を担う第 3 市場を扱う。";
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BalancingMarketPage() {
  let data: PageData;
  try {
    data = await loadPageData();
  } catch {
    notFound();
  }

  const { products, observationCutoff, updatedAt } = data;
  const chartSeries: BalancingProductSeries[] = products.map((p) => ({
    id: p.indicator.id,
    name: PRODUCT_META[p.indicator.id as (typeof PRODUCT_IDS)[number]].label,
    color: PRODUCT_META[p.indicator.id as (typeof PRODUCT_IDS)[number]].color,
    points: p.points,
  }));

  // tertiary-2 の長期推移 (2021〜) を取り出す
  const tertiary2 = products.find((p) => p.indicator.id === "balancing-price-tertiary-2");
  const tertiary2LastFy = tertiary2?.points.at(-1)?.value ?? null;

  const sla = products.map((p) => slaStatusOf(p.indicator));
  const worstStatus = sla.some((s) => s.status === "breach")
    ? "breach"
    : sla.some((s) => s.status === "warning")
      ? "warning"
      : "healthy";
  const freshnessBadgeClass =
    worstStatus === "healthy"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : worstStatus === "warning"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-rose-50 border-rose-200 text-rose-700";

  return (
    <Container size="data" className="py-10">
      <header className="mb-8">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <Link href="/markets" className="hover:text-emerald-700">
            市場
          </Link>
          {" ／ "}
          需給調整市場
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          需給調整市場 (EPRX)
        </h1>
        <p className="mt-2 text-sm text-subink leading-relaxed">
          一般送配電事業者が周波数制御・需給バランス調整に必要な調整力 (ΔkW) を広域で調達する全国共通市場。
          約定結果は{" "}
          <a
            href="https://www.eprx.or.jp/information/summary.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            電力需給調整力取引所 (EPRX) の年次取りまとめ
          </a>{" "}
          として PDF 公表される。
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${freshnessBadgeClass}`}
          >
            年次・手動更新／出典 EPRX
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
            最終観測: {observationCutoff} (FY2025 上期・暫定)
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-faint tabular-nums">
            updated {updatedAt.slice(0, 10)}
          </span>
        </div>
      </header>

      {/* (1) はじめに: 3 大市場の位置づけ */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-ink">需給調整市場とは</h2>
        <p className="mt-3 text-base text-subink leading-relaxed">
          <Link href="/glossary/balancing-market" className="text-emerald-700 underline hover:text-emerald-900">
            需給調整市場
          </Link>
          は、刻一刻と変動する需要と供給の差を一般送配電事業者が埋めるために必要な「調整力 (ΔkW)」を、エリアを跨いで広域かつ公平に調達する全国共通市場です。
          2021 年 4 月に三次調整力②から開設され、2024 年度に一次調整力・二次調整力①②・三次調整力①・複合商品まで全商品が出揃いました。
          {" "}
          <Link href="/glossary/freq-control" className="text-emerald-700 underline hover:text-emerald-900">
            周波数制御
          </Link>
          (東日本 50Hz / 西日本 60Hz の維持) の物理的な原資が、この市場で取引されます。
        </p>
        <h3 className="mt-6 text-lg font-semibold text-ink">日本電力の 3 大市場における位置づけ</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded">
            <thead className="bg-slate-50 text-ink">
              <tr>
                <th className="text-left px-3 py-2 border-b border-slate-200">市場</th>
                <th className="text-left px-3 py-2 border-b border-slate-200">取引対象</th>
                <th className="text-left px-3 py-2 border-b border-slate-200">時間軸</th>
                <th className="text-left px-3 py-2 border-b border-slate-200">本サイトの導線</th>
              </tr>
            </thead>
            <tbody className="text-subink">
              <tr>
                <td className="px-3 py-2 border-b border-slate-100">JEPX スポット</td>
                <td className="px-3 py-2 border-b border-slate-100">
                  kWh 価値 (実電力量)
                </td>
                <td className="px-3 py-2 border-b border-slate-100">日次・前日約定</td>
                <td className="px-3 py-2 border-b border-slate-100">
                  <Link
                    href="/catalog?domain=electricity"
                    className="text-emerald-700 underline hover:text-emerald-900"
                  >
                    catalog (electricity)
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-slate-100">容量市場</td>
                <td className="px-3 py-2 border-b border-slate-100">
                  kW 価値 (長期供給力)
                </td>
                <td className="px-3 py-2 border-b border-slate-100">4 年先・年 1 回</td>
                <td className="px-3 py-2 border-b border-slate-100">
                  <Link
                    href="/insight/capacity-market-5-year-trends"
                    className="text-emerald-700 underline hover:text-emerald-900"
                  >
                    Insight #61 容量市場 6 年推移
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  <strong className="text-ink">需給調整市場</strong>
                </td>
                <td className="px-3 py-2">調整力 (ΔkW)</td>
                <td className="px-3 py-2">即時 (秒〜45 分)</td>
                <td className="px-3 py-2">本ページ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* (2) 商品の階層図 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-ink">調整力商品の階層 — 応動時間で 5 商品 + 複合</h2>
        <p className="mt-3 text-base text-subink leading-relaxed">
          応動時間 (指令から出力到達までの時間) が短いほど、並列義務など制約が厳しく、平均落札単価も高くなる傾向があります。
          再エネ大量導入で予測誤差リスクが拡大する中、最も時間軸の緩い三次調整力② が需給調整市場で最初に開設された商品です。
        </p>
        <ol className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_IDS.map((id) => {
            const meta = PRODUCT_META[id];
            return (
              <li
                key={id}
                className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                style={{ borderLeft: `4px solid ${meta.color}` }}
              >
                <div className="font-semibold text-ink">{meta.label}</div>
                <div className="mt-1 text-xs text-faint">応動時間: {meta.response}</div>
                <div className="mt-1 text-xs text-subink">{meta.role}</div>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-faint">
          用語詳細: <Link href="/glossary/tertiary-2" className="text-emerald-700 underline hover:text-emerald-900">三次調整力②</Link>
          {" / "}
          <Link href="/glossary/balancing-market" className="text-emerald-700 underline hover:text-emerald-900">需給調整市場</Link>
          {" / "}
          <Link href="/glossary/freq-control" className="text-emerald-700 underline hover:text-emerald-900">周波数制御</Link>
        </p>
      </section>

      {/* (3) 主役チャート */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-ink">商品別 年間平均落札単価 (FY2021〜FY2025 上期)</h2>
        <p className="mt-3 text-base text-subink leading-relaxed">
          6 商品の年間平均落札単価 ({products[0].indicator.unit}) を 1 枚に重ねたもの。
          点線は EPRX 取りまとめ PDF に示される上限価格 {CEILING_PRICE} 円/ΔkW・30分 (参照線) です。
          一次調整力 (GF 並列が必須・週間断面で応札) が最も高く、再エネ予測誤差対応の三次調整力② が最も緩やかな水準で推移しています。
        </p>
        <div className="mt-4">
          <BalancingProductsChart
            series={chartSeries}
            ceiling={CEILING_PRICE}
            unit={products[0].indicator.unit}
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded">
            <thead className="bg-slate-50 text-ink">
              <tr>
                <th className="text-left px-3 py-2 border-b border-slate-200">商品</th>
                <th className="text-right px-3 py-2 border-b border-slate-200 tabular-nums">FY2024</th>
                <th className="text-right px-3 py-2 border-b border-slate-200 tabular-nums">
                  FY2025 上期 (暫定)
                </th>
                <th className="text-left px-3 py-2 border-b border-slate-200">系列詳細</th>
              </tr>
            </thead>
            <tbody className="text-subink">
              {products.map((p) => {
                const meta = PRODUCT_META[p.indicator.id as (typeof PRODUCT_IDS)[number]];
                const { fy2024, fy2025 } = lastTwoYears(p.points);
                return (
                  <tr key={p.indicator.id}>
                    <td className="px-3 py-2 border-b border-slate-100">
                      <span
                        className="inline-block mr-2 h-2 w-2 rounded-full align-middle"
                        style={{ backgroundColor: meta.color }}
                        aria-hidden
                      />
                      {meta.label}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-right tabular-nums">
                      {formatPrice(fy2024)}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 text-right tabular-nums">
                      {formatPrice(fy2025)}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100">
                      <Link
                        href={`/catalog/${p.indicator.id}`}
                        className="text-emerald-700 underline hover:text-emerald-900"
                      >
                        {p.indicator.id}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-faint leading-relaxed">
          単位: {products[0].indicator.unit}。FY2025 は上期 (2025-04 〜 2025-09) のみの集計に基づく暫定値で、全年度公表後に改訂予定。
          EPRX 年次取りまとめ PDF より転記・編集 (加工した旨を明記)。
        </p>
      </section>

      {/* (4) 三次② 長期スポット */}
      {tertiary2 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-ink">三次調整力② の 5 年推移 (市場最古参商品)</h2>
          <p className="mt-3 text-base text-subink leading-relaxed">
            三次調整力② は需給調整市場の最古参商品 (2021 年 4 月開設) で、5 年分の年間平均落札単価が公表されています。
            ゲートクローズが前日のため気象予測精度に左右されやすく、燃料価格・JEPX スポット価格と一定の相関 (2021〜2023 で相関係数 0.7 前後) を示してきました。
            近年は蓄電池・VPP の高値応札と再エネ予測誤差の縮小が交錯し、{formatPrice(tertiary2LastFy)} 円 (FY2025 上期暫定) と低水準まで戻しています。
          </p>
          <div className="mt-4">
            <ChartLine id="balancing-price-tertiary-2" height={280} showZoom={false} />
          </div>
          <p className="mt-2 text-xs text-faint">
            JEPX スポットとの相関係数は EPRX 年次取りまとめ PDF の「商品別単価と他市場の相関」項より転記
            (2021: 0.83 / 2022: 0.71 / 2023: 0.37、FY2024 以降は本サイトでは再計算未掲載)。
          </p>
        </section>
      )}

      {/* (5) catalog 6 系列カード */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-ink">構成系列 (catalog)</h2>
        <p className="mt-3 text-sm text-subink leading-relaxed">
          本ページで使用している 6 系列。各 ID をクリックすると D-011 メタデータ 19 項目フルの個別ページに遷移します。
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {products.map((p) => {
            const meta = PRODUCT_META[p.indicator.id as (typeof PRODUCT_IDS)[number]];
            const lastVal = p.points.at(-1)?.value ?? null;
            const lastDate = p.points.at(-1)?.date ?? "—";
            return (
              <li key={p.indicator.id}>
                <Link
                  href={`/catalog/${p.indicator.id}`}
                  className="block rounded-md border border-slate-200 bg-white p-3 transition hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                  style={{ borderLeft: `4px solid ${meta.color}` }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{meta.label}</span>
                    <span className="text-xs text-faint">{p.points.length} 期</span>
                  </div>
                  <div className="mt-1 text-xs text-faint tabular-nums">{p.indicator.id}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold tabular-nums text-ink">
                      {formatPrice(lastVal)}
                    </span>
                    <span className="text-[11px] text-faint">{p.indicator.unit}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-faint">as-of {lastDate}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* (6) 関連リンク */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-ink">関連</h2>
        <ul className="mt-3 list-disc pl-6 text-base text-subink leading-relaxed space-y-1">
          <li>
            <Link
              href="/insight/balancing-market-5-products-comparison"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              Insight #62 需給調整市場 商品別 約定価格の構造
            </Link>{" "}
            — 本市場ページの編集解説 (6 商品の年間平均落札単価と調達不足率の対比)
          </li>
          <li>
            <Link
              href="/insight/tertiary-balance-vs-jepx"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              Insight #63 三次調整力② × JEPX
            </Link>{" "}
            — 唯一の 5 年系列と卸価格・燃料の年次連動 (相関 0.80 → 0.37)
          </li>
          <li>
            <Link
              href="/insight/capacity-market-5-year-trends"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              Insight #61 容量市場メインオークション 6 年推移
            </Link>{" "}
            — 同じ kW 価値ファミリーで、長期供給力 (4 年先) を扱う姉妹市場
          </li>
          <li>
            用語集:{" "}
            <Link href="/glossary/balancing-market" className="text-emerald-700 underline hover:text-emerald-900">
              需給調整市場
            </Link>
            {" / "}
            <Link href="/glossary/tertiary-2" className="text-emerald-700 underline hover:text-emerald-900">
              三次調整力②
            </Link>
            {" / "}
            <Link href="/glossary/freq-control" className="text-emerald-700 underline hover:text-emerald-900">
              周波数制御
            </Link>
            {" / "}
            <Link href="/glossary/kw-value" className="text-emerald-700 underline hover:text-emerald-900">
              kW 価値
            </Link>
            {" / "}
            <Link href="/glossary/jepx-spot" className="text-emerald-700 underline hover:text-emerald-900">
              JEPX スポット
            </Link>
          </li>
        </ul>
      </section>

      {/* (7) データ品質 / 出典フッター */}
      <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-subink space-y-2">
        <h2 className="text-lg font-semibold text-ink">出典・データ品質</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            出典:{" "}
            <a
              href="https://www.eprx.or.jp/information/summary.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              一般社団法人 電力需給調整力取引所 (EPRX) 取引実績の取りまとめ結果
            </a>{" "}
            — 年次取りまとめ PDF より転記・編集 (加工した旨を明記)。
          </li>
          <li>
            ライセンス:{" "}
            <a
              href="https://www.eprx.or.jp/terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              EPRX 利用規約 §4
            </a>{" "}
            (非商用・出典明示で利用可。商用利用は事前契約、自動的な大量取得は事前承諾)。
          </li>
          <li>
            更新方針: 年次・手動。自動 fetcher は設けない (D-018)。
            EPRX の年次 PDF 公表 (例年 11〜12 月の年度別暫定値と翌年度の確定値) に合わせて手動転記する。
          </li>
          <li>
            掲載しない指標: 不足率は 2023→2024 で定義が不連続のため、現時点では本系列に含めません。
            電源種別別単価 (蓄電池 / VPP) は第 2 弾で検討中。
          </li>
          <li>
            単位: 円/ΔkW・30分。EPRX PDF 上では kW / ΔkW の表記揺れがあるが実体は同一。
          </li>
        </ul>
      </section>
    </Container>
  );
}
