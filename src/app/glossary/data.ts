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

  // ===== Day 6 PM (2026-05-17) international 拡張 +5 項目: 45 → 50 =====
  {
    slug: "fed-dot-plot",
    name: "FRB ドットプロット",
    description:
      "Fed Dot Plot。FRB（FOMC）が年 4 回（3/6/9/12 月）公表する Summary of Economic Projections（SEP）に含まれる、各 FOMC メンバーが妥当と考える将来の Fed Funds Rate を点で散布した図。市場は中央値（median dot）を「FRB の利上げ／利下げ意図のシグナル」として注視。日本の電力・燃料市場には FFR → 日米金利差 → 為替 → 円建て燃料コスト経由で波及。Insight 関連: us-2y-vs-jepx-tokyo, fed-funds-vs-jepx-tokyo。",
    category: "international",
  },
  {
    slug: "core-pce",
    name: "米コア PCE",
    description:
      "Core PCE Price Index。米商務省 BEA が月次公表する個人消費支出物価指数から食品・エネルギーを除いたもの。FRB が CPI ではなく PCE を「最重視するインフレ指標」と公式声明で位置付けており、コア PCE 前年同月比 2% が長期目標。これを上回れば利上げ／利下げ停止圧力 → ドル高 → 円安 → 日本のエネルギー輸入コスト上昇。BLS の CPI とは指数構成・対象期間・帰属家賃の扱いが異なる。Insight 関連: us-cpi-vs-fx, us-food-cpi-vs-yen-lng。",
    category: "international",
  },
  {
    slug: "yield-curve-inversion",
    name: "イールドカーブ逆転",
    description:
      "Yield Curve Inversion。長短金利逆転（典型的には US 10Y < US 2Y）。歴史的に景気後退の先行指標として最も信頼性が高いシグナルの一つで、過去 50 年で 8 回中 7 回後に景気後退が発生（誤シグナル 1 回）。逆転 → 銀行の収益悪化 → 貸出鈍化 → 投資縮小の経路。日本のエネルギー需要にも 6-18 か月遅れで波及し、JEPX 需要側を冷ます方向に作用。Insight 関連: us-yield-curve-vs-jp-demand, spread-us-jp-10y-vs-fx。用語集 [[inversion]] とは個別概念、本項目は経済シグナルとしての文脈。",
    category: "international",
  },
  {
    slug: "cbam",
    name: "国境炭素調整 (CBAM)",
    description:
      "Carbon Border Adjustment Mechanism。EU が 2026 年本格施行する炭素関税。EU 域内に輸入される鉄鋼・アルミ・セメント・肥料・電力・水素・鉱物のうち、域外で排出された CO2 量に対し EU ETS 価格との差額を「CBAM 証書」として徴収。日本企業の EU 輸出（自動車部品 / 機械 / 化学）に直接コスト発生、間接的に日本の電力業界へも GX-ETS 価格上昇圧力。[[eua]] [[gx-ets]] と連動。",
    category: "international",
  },
  {
    slug: "lng-spot-vs-contract",
    name: "LNG スポット vs 長期契約",
    description:
      "LNG Spot vs Long-Term Contract。日本の LNG 調達は ① JKM 連動スポット ② Brent 連動長期契約（HH 連動 / oil-indexed）の 2 系統。スポット比率は 2010 年 ~10% → 2024 年 ~30% へ拡大、価格変動性も上昇。長期契約は 15-20 年・take-or-pay 条項あり、価格は安定するが volume の柔軟性が低い。電力会社は両者をハイブリッド調達し fuel-adj 申請に反映。[[lng-jkm]] [[fuel-shock]] [[cif-price]] と密接。Insight 関連: global-lng-price-comparison, lng-vs-price-tokyo。",
    category: "international",
  },

  // ===== Phase D (2026-05-21) Insight #61 capacity-market-5-year-trends 連動 +3 項目: 50 → 53 =====
  {
    slug: "capacity-market",
    name: "容量市場（詳細）",
    description:
      "Capacity Market（詳細版）。実需給の 4 年前に将来の供給力（kW 価値）を OCCTO が事前確保する市場で、年 1 回のメインオークションで約定する。2020 年度初回オークション（2024 年度向け）から本格運用、約定価格は 14,137 円/kW（2024 年度向け）→ 5,242 円/kW（2025 年度向け）→ 6,742 円/kW（2026 年度向け）と推移。発電事業者は容量収入を得て老朽火力の維持・新設投資の予見性を確保、需要家は容量拠出金として小売料金経由で負担。[[capacity]] の制度詳細版、[[occto]] が運営、[[main-auction]] が中核プロセス。Insight #61 で 5 年推移を可視化。",
    category: "regulation",
  },
  {
    slug: "occto",
    name: "OCCTO（電力広域的運営推進機関）",
    description:
      "Organization for Cross-regional Coordination of Transmission Operators, Japan。2015 年 4 月設立の認可法人で、全国の電力需給・系統運用を広域調整する。主要業務は ① 容量市場の運営（メインオークション・追加オークション）② 需給調整市場の運営（一次〜三次調整力）③ 連系線利用ルール策定 ④ 広域系統長期方針の策定。電力自由化（2016 年）以降の市場運営の中核組織で、[[capacity-market]] [[main-auction]] [[imbalance]] [[grid-constraint]] の制度的基盤を支える。Insight #61 の容量市場データソース。",
    category: "regulation",
  },
  {
    slug: "main-auction",
    name: "メインオークション（容量市場）",
    description:
      "Main Auction。容量市場で実需給年度の 4 年前に年 1 回開催される、本体オークション。OCCTO が需要曲線（kW 量 × 上限価格）を提示し、発電事業者が供給曲線（kW × 入札価格）を応札、マルチプライス約定で全約定者にエリアプライスが支払われる。2020 年度初回（2024 年度向け）→ 2021 年度（2025 年度向け）→ 2022 年度（2026 年度向け）と毎年実施。約定結果はメインオークションの直後 3-4 ヶ月で公表される。供給力不足時には実需給 1 年前の追加オークションも開催。[[capacity-market]] の中核プロセス、[[occto]] が運営、[[peak-demand]] の長期確保手段。",
    category: "regulation",
  },

  // ===== Phase D (2026-05-22) Insight #61 連動 容量市場関連 +2 項目: 53 → 55 =====
  {
    slug: "capacity-payment",
    name: "容量拠出金",
    description:
      "Capacity Payment。小売電気事業者および一般送配電事業者が、容量市場で確保された供給力（kW 価値）の対価として OCCTO へ支払う負担金。需要曲線で約定した kW 量 × エリアプライスで算定され、最終的に小売電気料金（規制料金・自由料金）に転嫁されて需要家負担となる。2024 年度向け 14,137 円/kW の約定価格を起点に、容量市場のオークション結果が 4 年遅れで小売料金に反映される構造。[[capacity-market]] の対価メカニズム、[[main-auction]] が金額決定、[[fuel-adj]] や [[fuel-pass-through]] と並ぶ小売料金の主要構成要素。Insight #61 で 5 年推移を可視化。",
    category: "regulation",
  },
  {
    slug: "kw-value",
    name: "kW 価値",
    description:
      "kW Value。「確実に出せる供給力（kW）」そのものに対する価値で、容量市場で取引される対象。実発電量（kWh）に対する価値である「kWh 価値」（JEPX スポット市場で取引）と対の概念として整理され、kW 価値 = ピーク需要対応の長期供給力確保、kWh 価値 = 短期需給バランスでの実電力量、という時間軸の違いで切り分けられる。発電事業者は固定費（建設費・維持費）回収を kW 価値で、変動費（燃料費）回収を kWh 価値で行う二段階収益モデル。[[capacity-market]] [[main-auction]] [[capacity-payment]] と密接、[[peak-demand]] の長期確保がコアミッション、[[jepx-spot]] の kWh 価値と対比して理解。",
    category: "regulation",
  },

  // ===== Phase D (2026-05-23) D-018 需給調整市場 +3 項目: 55 → 58 =====
  {
    slug: "balancing-market",
    name: "需給調整市場",
    description:
      "Balancing Market。一般送配電事業者が周波数制御・需給バランス調整に必要な調整力（ΔkW）を、エリアを跨いで広域かつ公平に調達する全国共通市場。2021 年 4 月に三次調整力②から開設され、2024 年度に一次調整力・二次調整力①②・三次調整力①・複合商品まで全商品が出揃った。約定結果は一般社団法人 電力需給調整力取引所（EPRX）が年次の取りまとめ結果として公表する。JEPX スポット市場（kWh 価値）・容量市場（kW 価値の長期確保）と並ぶ日本電力の 3 大市場の一つで、本市場は「即時の調整力」という時間軸を担う。[[occto]] が広域運用の標準規格を策定、[[imbalance]] の解消手段、[[kw-value]] として取引、[[freq-control]] を実現する原資。",
    category: "regulation",
  },
  {
    slug: "tertiary-2",
    name: "三次調整力②",
    description:
      "Tertiary Reserve 2。需給調整市場の商品の一つで、再生可能エネルギーの出力予測誤差に対応する、最も応動時間の緩やかな（指令から 45 分以内）調整力。2021 年 4 月の市場開設時に最初に取引が始まった商品で、ゲートクローズが前日のため気象予測精度に左右されやすい。約定単価は燃料価格・JEPX スポット価格と一定の相関（2021〜2023 で相関係数 0.7 前後）を示し、近年は蓄電池・VPP（DR）の高値応札が平均単価を押し上げる場面も見られる。[[balancing-market]] の最古参商品、[[fuel-shock]] と連動、[[freq-control]] の中でも長い時間軸を担当。",
    category: "regulation",
  },
  {
    slug: "freq-control",
    name: "周波数制御",
    description:
      "Frequency Control。電力系統の周波数（東日本 50Hz / 西日本 60Hz）を、刻一刻と変動する需要と供給の差に応じて基準値付近に保つ制御。発電機のガバナフリー（GF、一次）、負荷周波数制御（LFC、二次）、経済負荷配分（EDC、三次）の階層で実現され、それぞれ需給調整市場の一次・二次・三次調整力として調達される。周波数のずれは需給インバランスの物理的な現れであり、制御に失敗すると周波数低下による発電機の連鎖解列＝大規模停電につながる。[[balancing-market]] が調達原資、[[imbalance]] の物理的指標、調整力の存在意義そのもの。",
    category: "regulation",
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
