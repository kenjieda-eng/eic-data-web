export type GlossaryCategory =
  | "basic"
  | "regulation"
  | "fuel"
  | "power"
  | "finance"
  | "economy"
  | "international";

export interface GlossaryTerm {
  slug: string;
  name: string;
  description: string;
  category: GlossaryCategory;
}

export const GLOSSARY_CATEGORIES: Record<GlossaryCategory, string> = {
  basic: "基本",
  regulation: "制度",
  fuel: "燃料",
  power: "電力",
  finance: "金融・マクロ",
  economy: "経済",
  international: "国際",
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "jepx-spot",
    name: "JEPX スポット",
    description:
      "日本卸電力取引所のスポット市場（前日市場）価格。",
    category: "basic",
  },
  {
    slug: "lng-jkm",
    name: "JKM",
    description:
      "Japan Korea Marker。北東アジア LNG スポット指標。",
    category: "fuel",
  },
  {
    slug: "fit",
    name: "FIT / FIP",
    description:
      "再エネ固定価格買取制度 / フィードインプレミアム。買取期間 10〜20 年、調達コストは賦課金で需要家負担。",
    category: "regulation",
  },
  {
    slug: "gx-ets",
    name: "GX-ETS",
    description:
      "日本の排出量取引制度（GX-ETS）。2026 年 4 月から本格稼働。",
    category: "regulation",
  },
  {
    slug: "peak-demand",
    name: "ピーク需要",
    description:
      "年間／季節最大電力需要。日本は夏ピーク（猛暑日 14 時前後）と冬ピーク（寒波早朝）の二重構造。",
    category: "power",
  },
  {
    slug: "capacity",
    name: "容量市場",
    description:
      "将来の供給力を事前に取引する市場。日本では 2024 年度から本格運用。",
    category: "regulation",
  },
  {
    slug: "imbalance",
    name: "インバランス",
    description: "計画と実績の差に対する補給・精算制度。",
    category: "regulation",
  },
  {
    slug: "scope123",
    name: "Scope 1/2/3",
    description:
      "温室効果ガス排出の直接・間接・サプライチェーン分類。",
    category: "basic",
  },
  {
    slug: "wacc",
    name: "WACC",
    description: "加重平均資本コスト。",
    category: "finance",
  },
  {
    slug: "eua",
    name: "EUA",
    description: "EU 排出枠（EU-ETS）。",
    category: "regulation",
  },
  {
    slug: "baseload",
    name: "ベースロード",
    description:
      "24 時間連続で運転される電源（原子力・大型水力・石炭・地熱など）。需要の年間最低水準を満たす。日本は震災後に火力依存度が上昇したが、再稼働で原子力が一部復帰。",
    category: "power",
  },
  {
    slug: "fuel-adj",
    name: "燃料費調整制度",
    description:
      "LNG・石炭・石油の輸入価格変動を、平均値±50% の範囲で電力小売料金に自動転嫁する制度。1996 年導入。燃料コストショックの真の影響は卸価格より小売料金に出る。",
    category: "regulation",
  },
  {
    slug: "fuel-shock",
    name: "燃料コストショック",
    description:
      "国際エネルギー市場（LNG・原油）の急騰で、火力発電のコストが急上昇する現象。2022 年欧州ガス危機で日本 LNG-CIF が 3 倍に。電力会社の収益に直撃する。",
    category: "fuel",
  },
  {
    slug: "cutout-wind",
    name: "カットアウト風速",
    description:
      "風車が安全停止する風速の上限（一般に 25 m/s 前後）。それ以上では発電を停止。出力曲線は風速の 3 乗則に従い、定格風速（12〜15 m/s）でピーク。",
    category: "power",
  },
  {
    slug: "pumped-hydro",
    name: "揚水水力",
    description:
      "夜間の余剰電力で水を上池に汲み上げ、昼間に発電する貯蔵型水力。日本の蓄電容量の主力。再エネ普及で日中の余剰を吸収する役割が変化。",
    category: "power",
  },
  {
    slug: "grid-constraint",
    name: "系統制約",
    description:
      "送電線・変電設備の容量制限により、発電所が最大出力を出せない状態。北海道〜本州の連系線、九州エリアでの太陽光出力抑制が代表例。",
    category: "power",
  },
  {
    slug: "curtailment",
    name: "出力制御",
    description:
      "系統制約・需給バランス維持のため、再エネ電源（主に太陽光）の発電を強制的に停止する措置。九州・四国・東北で実施実績あり。",
    category: "power",
  },
  {
    slug: "cif-price",
    name: "CIF 価格",
    description:
      "Cost, Insurance and Freight。輸入価格に運賃・保険料を含めた港着価格。LNG-CIF 日本は World Bank Pink Sheet で月次公表。",
    category: "fuel",
  },
  {
    slug: "yield-curve",
    name: "イールドカーブ",
    description:
      "同一の発行体（例: 米国財務省、日本財務省）が発行する債券の、満期年数と利回りの関係を示す曲線。通常は右上がり（長期ほど高利回り）だが、景気後退の前兆として「逆イールド」（短期金利が長期金利を上回る）が観測されることがある。米 30y - 2y はその代表的な指標。",
    category: "finance",
  },
  {
    slug: "spread",
    name: "スプレッド（金利差）",
    description:
      "2 つの金利の差。日米 10 年金利差（米 10y - JGB 10y）は円キャリートレードの収益性を直接決め、為替レート（USD/JPY）の主要な決定要因の 1 つ。Insight #35 はこの構造を可視化。",
    category: "finance",
  },
  {
    slug: "fed-funds-rate",
    name: "FF レート",
    description:
      "FRB（米連邦準備制度）が決定する政策金利。商業銀行間の翌日物金利の誘導目標で、米国の金融政策スタンスを直接表現する。米 2 年国債金利（米 2y）は今後 1〜2 年の FF レート期待値を市場が織り込んだもの。Insight #38 で扱う。",
    category: "finance",
  },
  {
    slug: "treasury-bill",
    name: "T-Bill / 米国財務省証券",
    description:
      "米国政府が発行する債券の総称。期間 1 年以内が T-Bill、1〜10 年が T-Note、10 年超が T-Bond。EIC Data は米 2y/5y/10y/30y の 4 系列を Phase 3-A で取得（U.S. Treasury Daily Yields, public-domain）。",
    category: "finance",
  },
  {
    slug: "inversion",
    name: "逆イールド（金利逆転）",
    description:
      "通常は長期金利 > 短期金利となるイールドカーブが、短期金利 > 長期金利に逆転する現象。FRB の急激な利上げ局面で発生し、過去 50 年で景気後退の先行指標として高い的中率を持つ。2022-2023 年の米国で深い逆イールドが発生。Insight #36 で日本電力需要への波及を見る。",
    category: "finance",
  },
  {
    slug: "nonfarm-payrolls",
    name: "米雇用統計（非農業部門雇用者数）",
    description:
      "米労働省が毎月第 1 金曜日（21:30 JST）に公表する、農業以外の事業所で働く雇用者数の前月比増減。米国 GDP の約 70% を占める個人消費を駆動する所得の代理指標で、為替・米金利・株式が同時に動く市場最注目指標。EIC Data は FRED PAYEMS 系列で月次取得。FRB の二大マンデート（雇用最大化）を直接表現するため、FF レート政策見通しと表裏一体。Insight #43 で日本のエネルギー価格への波及を扱う予定。",
    category: "finance",
  },
  {
    slug: "unemployment-rate",
    name: "米失業率",
    description:
      "米労働省が雇用統計と同時公表する、労働力人口に占める失業者の比率。FRB の二大マンデートのうち雇用最大化の主要指標で、完全雇用近傍とされる 4% を分水嶺に金融政策スタンスが切り替わる。EIC Data は FRED UNRATE 系列で月次取得。インフレ目標 2% と並ぶ FRB の意思決定軸として、米雇用統計（NFP）とセットで読まれ、フィリップス曲線を介してコア CPI 動向の見通しにも影響する。",
    category: "finance",
  },
  {
    slug: "core-cpi",
    name: "コア CPI（食品・エネルギー除く）",
    description:
      "Consumer Price Index Less Food & Energy。価格変動の大きい食品とエネルギーを除外した消費者物価指数で、基調的なインフレトレンドを見極めるために FRB が重視する。米コア CPI は 12 ヶ月前比 %（YoY）で公表され、2% 安定が政策目標。EIC Data は FRED CPILFESL 由来の us-cpi-yoy 系列で月次取得済。ヘッドライン CPI と乖離するときが政策判断の分かれ目になる。",
    category: "finance",
  },
  {
    slug: "headline-cpi",
    name: "ヘッドライン CPI（総合）",
    description:
      "Consumer Price Index for All Items。エネルギー・食品を含む全品目の消費者物価指数で、見出しに使われる「インフレ率」の本体。消費者が日々体感する物価そのものを表すため、選挙・賃金交渉・年金スライドの基準となる。米国は CPI-U（都市部）が主流で、12 ヶ月前比 %（YoY）形式で月次公表。エネルギー価格の急騰局面ではコア CPI と乖離が拡大し、政策ジレンマを生む。",
    category: "finance",
  },
  {
    slug: "tankan-di",
    name: "日銀短観 DI（業況判断指数）",
    description:
      "日本銀行が四半期（4 月初・7 月初・10 月初・12 月中旬）に公表する企業向けアンケート調査の代表指標。「業況が良い」と回答した企業比率から「悪い」を引いた値（%pt）で、+ は景気拡大、- は後退局面を示す。大企業製造業・大企業非製造業・中小企業製造業・中小企業非製造業の 4 区分が市場注目度の中心。最古系列は中小企業製造業の 1967Q3 で、59 年分の日本マクロ史を網羅。EIC Data は BOJ stat-search db=CO から 4 系列取得済（tankan-large-mfg-di ほか）。",
    category: "finance",
  },
  {
    slug: "food-cpi",
    name: "食品 CPI",
    description:
      "消費者物価指数のうち食品サブインデックス。エネルギー価格上昇が肥料・物流・包装材経由で食品価格に波及する代表チャネルで、エネルギーショックの第 2 波として 2-3 四半期遅れで上昇する傾向がある。米国は FRED CPIUFDSL を、EIC Data は us-cpi-food-yoy として月次取得済。家計支出に占める比率が大きいため、低所得層の体感インフレと相関が強い。コア CPI（食品・エネルギー除く）との対比で、基調インフレと一次産品ショックを切り分けて読む。",
    category: "economy",
  },
  {
    slug: "energy-cpi",
    name: "エネルギー CPI",
    description:
      "消費者物価指数のうちガソリン・電気・ガス・暖房油などエネルギー関連品目のサブインデックス。原油・LNG など国際燃料市場の変動が、日本では燃料費調整制度を経て 3-5 ヶ月遅れで電気・ガス料金に反映される。米国は FRED CPIENGSL を、EIC Data は us-cpi-energy-yoy として月次取得済。ヘッドライン CPI とコア CPI の差分の主因で、エネルギーインフレが頭打ちになるとヘッドラインも素早く反落する非対称な動きが特徴。",
    category: "economy",
  },
  {
    slug: "industrial-production",
    name: "鉱工業生産指数",
    description:
      "製造業・鉱業・電気ガス業の生産活動を統合した指数。電力需要のもっとも有力な先行指標で、稼働率の変化が約 1-2 ヶ月遅れで産業用電力消費に反映される。米国は FRED INDPRO（Industrial Production Index）が代表で、EIC Data は us-industrial-production 系列で月次取得済。景気循環の山谷を捉える古典的マクロ指標として、リセッション判定にも使われる。",
    category: "economy",
  },
  {
    slug: "business-sentiment",
    name: "景況感",
    description:
      "企業経営者が現在および先行きの事業環境をどう捉えているかを表す総合指標。日銀短観 DI 大企業製造業がベンチマークとして引用されることが多く、設備投資意欲・雇用判断・在庫水準など複数のサブ指標と連動する。GDP 統計より 1-2 四半期早く景気の転換点を示すため「設備投資の先行指標」として政策判断・市場参加者の双方に重視される。米国では ISM 製造業 PMI、欧州では IFO 指数が同役割を果たし、為替と株式に直接波及する。",
    category: "economy",
  },
  {
    slug: "energy-inflation",
    name: "エネルギーインフレ",
    description:
      "原油・天然ガス・石炭など一次エネルギー価格の上昇が、輸送費・原材料費・電気料金を経由して消費者物価全般に波及する現象。日本は 2022-2024 年に円安と LNG 価格高騰の同時打撃を受け、ヘッドライン CPI の主因がエネルギーになる局面が長く続いた。コア CPI からは除外される一方、家計の体感インフレと購買力に直結するため政治マターになりやすい。Insight #11/#12/#14 で構造を扱う。",
    category: "economy",
  },
  {
    slug: "fuel-pass-through",
    name: "燃料費調整（パススルー）",
    description:
      "LNG・石炭・原油の輸入価格を、3-5 ヶ月遅れで電気料金に転嫁する制度・メカニズムの総称。日本では 1996 年導入の燃料費調整制度（fuel-adj）が代表だが、ガス料金・産業用契約にも同様の連動条項が存在。輸入価格変動が需要家負担に届くまでのラグが、卸電力価格（JEPX）と小売料金の体感乖離を生む。Insight #11/#12/#14/#29 はこの波及構造を異なる時間軸で可視化する。為替（USD/JPY）と CIF 価格の同時動きが小売料金に重なって反映される点が、円安局面の体感インフレの主因。",
    category: "regulation",
  },
  {
    slug: "demand-elasticity",
    name: "需要弾力性（電力）",
    description:
      "電力料金が 1% 上昇したときに需要が何 % 減少するかを示す係数。長期（10 年スパン、設備更新・断熱投資反映）では 0.3-0.5、短期（1 年以内、行動変容主体）では 0.1 程度が日本の典型値とされる。燃料費調整による料金上昇局面で需要削減が小さいことは、エネルギーコストが家計・企業に重い負担として残る理由になる。再エネ普及・電化進展により値は時代とともに変動するほか、所得水準・気候・産業構成によっても国・地域で大きな差が出る。",
    category: "economy",
  },

  // ===== Day 5 午後タスク 2 拡張 (+10 項目、35 → 45) =====
  // 新カテゴリ "international" (4 項目)
  {
    slug: "eu-ets",
    name: "EU ETS（欧州排出量取引制度）",
    description:
      "European Union Emissions Trading System。世界最大の炭素市場、2005 年運用開始。EU 域内の発電所・産業施設の CO2 排出量に対し、排出枠（EU Allowance = EUA）の市場取引を強制する制度。価格（EUR/tCO2）は 2021 年以降の引き締めで急騰、第 4 フェーズ（2021-）でピーク €90 を記録。日本の電力市場には、欧州エネルギー転換 → アジア LNG 需給逼迫 → 円建て LNG 上昇の伝播経路で影響。Insight #48 で詳細解説。",
    category: "international",
  },
  {
    slug: "china-pmi",
    name: "中国 PMI（Caixin 製造業指数）",
    description:
      "Caixin Purchasing Managers' Index。中国製造業の景況感を 50 を中立水準として表す指数。50 超は拡大、50 未満は縮小。NBS（国家統計局、大企業中心）と Caixin（中小企業中心、市場感度高）の 2 系統があり、EIC Data では Caixin PMI を採用。中国経済の景気変動 → アジア LNG 需給 → 日本電力市場の伝播経路で重要な先行指標。Insight #49 + #51 で詳細解説。",
    category: "international",
  },
  {
    slug: "ecb-deposit-rate",
    name: "ECB 預金ファシリティ金利",
    description:
      "European Central Bank Deposit Facility Rate。欧州中央銀行（ECB）の主要政策金利の 1 つ、銀行が ECB に預ける際の金利。マイナス金利政策（2014-2022 年 7 月）から 2022 年 7 月の引き締め開始で +4.0%（2023 年 9 月ピーク）まで急上昇。USD/EUR + USD/JPY の三角関係に強く影響、円安進行の間接要因。Insight #50 で詳細解説。",
    category: "international",
  },
  {
    slug: "international-spillover",
    name: "国際金融スピルオーバー",
    description:
      "International Financial Spillover。ある国の金融政策・市場動向が他国の金融市場 + 商品市場に波及する現象。日本のエネルギー市場では、米国 FRB の利上げ → 円安 → 円建て LNG 上昇 → JEPX 卸価格 → 電気料金、という 5-6 段階の伝播経路を経て電気代に影響。EIC Data の国際金融指標（米 Treasury 4 系列 + USD/JPY + ECB + 中国 PMI）はこのスピルオーバーを定量化する基盤。Insight #43 + #48 + #50 で詳細解説。",
    category: "international",
  },

  // 電力カテゴリ拡張 (3 項目)
  {
    slug: "transmission-line-constraint",
    name: "連系線制約",
    description:
      "Transmission Line Constraint。電力エリア間を結ぶ連系線の容量上限による電力融通の制限。日本では北本連系線（北海道-本州）、阿南紀北直流連系線（四国-関西）、本四連系線（四国-中国）等が制約発生地点。太陽光大量導入エリア（九州・四国）で晴天日中に連系線が満杯になり、域内で電力余剰 → JEPX 価格暴落（場合により 1 円未満）。2026-05-15 四国 0.49 ¥/kWh は典型例。系統制約（grid-constraint）の連系線版。",
    category: "power",
  },
  {
    slug: "solar-curtailment",
    name: "太陽光カーテイルメント（出力抑制）",
    description:
      "Solar Curtailment。電力需給バランス調整のため、再エネ事業者（主に太陽光）に対し発電出力の一時停止を要請する制度。九州 + 四国エリアで春・GW・秋の晴天日中に頻発、域内需要 < 太陽光出力で連系線制約とともに発動。蓄電池導入経済性に直結する重要指標（カーテイルメントを回避するための充放電タイミング最適化）。出力制御（curtailment）の太陽光特化版。",
    category: "power",
  },
  {
    slug: "solar-surplus",
    name: "太陽光余剰",
    description:
      "Solar Surplus。太陽光発電の出力が域内電力需要を上回る状況。発生条件: ① 晴天（日射量大）② 軽負荷（休日・GW・工場稼働低下）③ 太陽光導入比率高（九州・四国・中国）。結果: JEPX 価格暴落（< 1 ¥/kWh）、カーテイルメント発動、連系線制約。2026-05-15 四国 0.49 ¥/kWh の主因。Phase B-A Day 3 / Phase B-B Day 7 で関連 Insight 多数。",
    category: "power",
  },

  // 金融カテゴリ拡張 (2 項目)
  {
    slug: "yen-denominated-cost",
    name: "円建てコスト",
    description:
      "Yen-Denominated Cost。USD 建ての国際商品（LNG / 原油 / 石炭 等）を JPY 建てに換算したコスト。`fuel-lng-jp-cif × fx-usdjpy-monthly-avg` で計算。為替変動（円安）+ 国際商品価格上昇の二重打撃で 2022-2024 年に急騰、日本電力業界の主要コストドライバー。bess-net.jp の AM IRR シミュレーターでも割引率連動として活用。",
    category: "finance",
  },
  {
    slug: "fed-funds-rate-jp-spillover",
    name: "FRB FF レート 日本スピルオーバー",
    description:
      "FRB Fed Funds Rate Spillover to Japan。米国連邦準備制度（FRB）の政策金利（Fed Funds Rate）が日本の金融・エネルギー市場に波及する経路。米利上げ → 日米金利差拡大 → 円安進行 → 円建て燃料コスト上昇 → JEPX 価格上昇 → 電気料金。2022-2024 年の FRB 急激利上げ（0.25% → 5.50%）が円安 154 円・JEPX 23 ¥/kWh の主要因。Insight #41 + #43 で詳細解説。",
    category: "finance",
  },

  // 経済カテゴリ拡張 (1 項目)
  {
    slug: "carbon-pricing",
    name: "カーボンプライシング",
    description:
      "Carbon Pricing。CO2 排出に価格付けする政策手段の総称。3 形態: ① 炭素税（税として政府が徴収）② 排出量取引（市場で排出枠を取引、EU ETS が代表）③ クレジット取引（削減量を売買、自主参加）。日本では 2026 年 GX-ETS 導入 + 2028 年 炭素賦課金開始予定。電力業界では発電コストへの上乗せ → JEPX 価格上昇圧力。Phase D 期（6 月以降）で関連系列追加検討候補。",
    category: "economy",
  },
];

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.slug === slug);
}

export function searchTerms(
  terms: GlossaryTerm[],
  query: string | null | undefined,
): GlossaryTerm[] {
  if (!query) return terms;
  const q = query.trim().toLowerCase();
  if (!q) return terms;
  return terms.filter((t) => {
    if (t.slug.toLowerCase().includes(q)) return true;
    if (t.name.toLowerCase().includes(q)) return true;
    if (t.description.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function groupTermsByCategory(
  terms: GlossaryTerm[],
): { category: GlossaryCategory; label: string; terms: GlossaryTerm[] }[] {
  const order: GlossaryCategory[] = [
    "basic",
    "regulation",
    "power",
    "fuel",
    "finance",
    "economy",
    "international",
  ];
  return order
    .map((category) => ({
      category,
      label: GLOSSARY_CATEGORIES[category],
      terms: terms.filter((t) => t.category === category),
    }))
    .filter((g) => g.terms.length > 0);
}
