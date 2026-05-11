/**
 * 朝刊サマリー サンプル原稿 5 日分 (5/13-5/17) — Phase C Day 2 で配置
 *
 * リン編集長が 2026-05-12 (火) 14:30 に手書きしたサンプル原稿
 * (docs/morning-summary-samples-2026-05-13-to-17.md) を構造化データに転記。
 * Phase D-Day-Z 以降は毎平日 7:00 JST の cron で append される想定。
 */

import type { MorningSummary } from "./morning-summary";

export const MORNING_SUMMARIES: Record<string, MorningSummary> = {
  "2026-05-13": {
    date: "2026-05-13",
    weekday: "水",
    weekend: false,
    generatedAt: "2026-05-13T07:00:00+09:00",
    alerts: [],
    relatedInsightSlugs: [
      "lng-vs-price-tokyo",
      "brent-lag-vs-price-tokyo",
      "spread-us-jp-10y-vs-fx",
      "fed-funds-vs-jepx-tokyo",
      "jgb-vs-yen-lng",
    ],
    weekendNote: null,
    lines: [
      {
        indicatorId: "jepx-spot-tokyo",
        label: "JEPX 東京",
        unit: "¥/kWh",
        value: 9.32,
        dod: 0.18,
        dodPct: 1.97,
        editor: "ハル",
        explanation:
          "JEPX 東京は前日比 +1.97% で 9.32 円/kWh、火力依存度の高い東日本での原油上昇 (WTI +1.55%) が時間差で卸価格に伝播し始めた可能性。Insight #11 (LNG × JEPX 東京) の月次相関 r=0.74 を踏まえると、5 月末〜6 月初に燃料費調整制度経由で小売料金に出る見込み。再エネ稼働率 (太陽光) は当週前半の薄曇りで例年比 -8%。",
      },
      {
        indicatorId: "fuel-crude-wti",
        label: "WTI 原油",
        unit: "$/bbl",
        value: 78.45,
        dod: 1.2,
        dodPct: 1.55,
        editor: "ハル",
        explanation:
          "WTI は前日比 +1.55% で 78.45 ドル/バレル、中東地政学リスク (週末のホルムズ海峡情勢) を受けて 3 営業日連続上昇。78 ドル台は 4 月初以来 6 週間ぶり、ブレント原油も同調 (Insight #14 のラグ相関でブレント → JEPX 東京は 3-5 ヶ月)。Henry Hub (米国天然ガス) は横這い、TTF (欧州天然ガス) は +0.8% で連動性低下。",
      },
      {
        indicatorId: "fx-usdjpy-monthly-avg",
        label: "USD/JPY",
        unit: "¥/$",
        value: 156.82,
        dod: 0.34,
        dodPct: 0.22,
        editor: "マコト",
        explanation:
          "USD/JPY は前日比 +0.22% で 156.82 円、日銀政策修正観測 (5 月会合で短期金利据え置き予測) + Fed FF rate 据え置き示唆で円安ドル高傾向継続。Insight #35 (日米 10y 金利差 × USD/JPY) の月次相関 r=0.81 から、当面 155-158 円のレンジ想定。Insight #13 (LNG × 円安要因分解) で示した「円安要因 +ΔL · F₀」が再び効きやすい局面。",
      },
      {
        indicatorId: "jgb-10y-yield",
        label: "JGB 10 年",
        unit: "%",
        value: 0.92,
        dod: 0.01,
        dodPct: 1.1,
        editor: "マコト",
        explanation:
          "JGB 10 年は前日比 +0.01pt で 0.92%、日銀の YCC 撤廃後初の 0.9% 台定着 (3 週間連続)。Insight #16 (JGB × 円建て LNG) の月次相関 r=0.65 を考慮すると、長期金利上昇は円キャリートレードの巻き戻し要因 + 円建て輸入コスト緩和要因の両方を含む。市場は 5 月 16-17 日の日銀政策決定会合に注目。",
      },
      {
        indicatorId: "us-cpi-yoy",
        label: "米 CPI YoY",
        unit: "%",
        value: 3.4,
        dod: null,
        dodPct: null,
        editor: "マコト",
        explanation:
          "米 CPI 前年比は 4 月分 3.4% (3 月 3.5% から 0.1pt 減速)、コア CPI は 3.8% (3 月 3.8% から横這い)。Fed の利下げ観測は年内 1-2 回 (CME FedWatch、9 月 + 12 月) で固定化、Insight #41 (Fed FF rate × JEPX 東京) で示した「金利差 → 円安 → 燃料コスト → JEPX 東京」の 4 段階連鎖は引き続き有効。次の更新は 6/11 (水) 米労働省発表。",
      },
    ],
  },

  "2026-05-14": {
    date: "2026-05-14",
    weekday: "木",
    weekend: false,
    generatedAt: "2026-05-14T07:00:00+09:00",
    alerts: [],
    relatedInsightSlugs: [
      "temp-vs-price",
      "lng-vs-price-tokyo",
      "spread-us-jp-10y-vs-fx",
    ],
    weekendNote: null,
    lines: [
      {
        indicatorId: "jepx-spot-tokyo",
        label: "JEPX 東京",
        unit: "¥/kWh",
        value: 9.18,
        dod: -0.14,
        dodPct: -1.5,
        editor: "ハル",
        explanation:
          "前日比 -1.50% 反落で 9.18 円/kWh、太陽光稼働率回復 (薄曇り → 晴天) で日中下落、関東地方の需給逼迫リスクは解消。Insight #1 (温度 × JEPX 東京) で示した「気温 → 需要 → 価格」の経路で、当週後半は 22 度前後の予報、空調需要は限定的。LNG ベース燃料費調整は来月後半に出る見込み。",
      },
      {
        indicatorId: "fuel-crude-wti",
        label: "WTI 原油",
        unit: "$/bbl",
        value: 77.92,
        dod: -0.53,
        dodPct: -0.68,
        editor: "ハル",
        explanation:
          "前日比 -0.68% で 77.92 ドル/バレル、ホルムズ海峡情勢は緩和方向、米国原油在庫増加 (EIA 週次統計、+340 万バレル) も売り材料。78 ドル台維持を試すが定着には材料不足。Insight #14 (Brent → JEPX 東京 ラグ相関) で示した 3-5 ヶ月の伝播経路を踏まえ、日本市場への影響は 8-10 月想定。",
      },
      {
        indicatorId: "fx-usdjpy-monthly-avg",
        label: "USD/JPY",
        unit: "¥/$",
        value: 156.45,
        dod: -0.37,
        dodPct: -0.24,
        editor: "マコト",
        explanation:
          "前日比 -0.24% で 156.45 円、米国 CPI 据え置きで円安修正、ただし 156 円台維持。次の触媒は 5/16-17 日銀会合。Insight #35 (日米 10y 金利差 × USD/JPY) の月次相関 r=0.81 から、JGB 10y が 0.91% に下がった分の円安圧力減少が小幅で反映。",
      },
      {
        indicatorId: "jgb-10y-yield",
        label: "JGB 10 年",
        unit: "%",
        value: 0.91,
        dod: -0.01,
        dodPct: -1.09,
        editor: "マコト",
        explanation:
          "前日比 -0.01pt で 0.91%、長期金利の上昇圧力は限定的、海外勢の買い戻し継続。5/16-17 日銀政策決定会合の織り込みは「据え置き」シナリオが主流。Insight #37 (米 30y × JGB 30y) で示した超長期金利のグローバル連動を踏まえると、米 10y が 4.3% 台で安定する限り JGB 10y は 0.9-1.0% レンジ想定。",
      },
      {
        indicatorId: "us-cpi-yoy",
        label: "米 CPI YoY",
        unit: "%",
        value: 3.4,
        dod: null,
        dodPct: null,
        editor: "マコト",
        explanation:
          "月次更新なし、Fed メンバー発言を注視 (今週後半に 3 名予定: パウエル議長 + ウィリアムズ NY 総裁 + ボストン総裁)。次回 6/11 (水) 米労働省発表で 5 月分が公開、市場予想は 3.2-3.3%。Insight #40 (米 CPI × USD/JPY) の月次相関 r=0.62 から、CPI が 3% 台前半に下がれば円安圧力減少シナリオを Fed が織り込む可能性。",
      },
    ],
  },

  "2026-05-15": {
    date: "2026-05-15",
    weekday: "金",
    weekend: false,
    generatedAt: "2026-05-15T07:00:00+09:00",
    alerts: [],
    relatedInsightSlugs: [
      "temp-vs-price",
      "lng-vs-price-tokyo",
      "brent-lag-vs-price-tokyo",
      "spread-us-jp-10y-vs-fx",
    ],
    weekendNote: null,
    lines: [
      {
        indicatorId: "jepx-spot-tokyo",
        label: "JEPX 東京",
        unit: "¥/kWh",
        value: 9.55,
        dod: 0.37,
        dodPct: 4.03,
        editor: "ハル",
        explanation:
          "前日比 +4.03% で 9.55 円/kWh、関東地方の需給ひっ迫警報 (28 度予報 + 大型空調稼働 + 太陽光の発電量見通し低下 = 雷雨予報) で急騰。Insight #1 (温度 × JEPX 東京) + Insight #11 (LNG × JEPX 東京) の両方の経路が同時に効いている。5 月例年比でも上位、5/15 (金) は週末を挟むため、5/18 (月) 朝刊で需給状況フォロー予定。",
      },
      {
        indicatorId: "fuel-crude-wti",
        label: "WTI 原油",
        unit: "$/bbl",
        value: 79.12,
        dod: 1.2,
        dodPct: 1.54,
        editor: "ハル",
        explanation:
          "前日比 +1.54% で 79 ドル台復帰、北海油田トラブル報道 (Forties + Brent の生産影響) + OPEC+ 減産延長観測 (6 月会合) で買い戻し。Insight #14 (Brent → JEPX 東京 ラグ相関) で 3-5 ヶ月後の伝播経路に注意、8 月の冷房需要ピークと重なる可能性。",
      },
      {
        indicatorId: "fx-usdjpy-monthly-avg",
        label: "USD/JPY",
        unit: "¥/$",
        value: 157.08,
        dod: 0.63,
        dodPct: 0.4,
        editor: "マコト",
        explanation:
          "前日比 +0.40% で 157 円台復帰、日米金利差拡大 (JGB 10y 上昇 + 米 10y 横這いで両側) でも円安進行。Insight #35 (日米 10y 金利差 × USD/JPY) の月次相関 r=0.81 と整合。日銀会合 5/16-17 後の円相場が焦点、政策修正なら 154-155 円試し、据え置きなら 158 円突破リスク。",
      },
      {
        indicatorId: "jgb-10y-yield",
        label: "JGB 10 年",
        unit: "%",
        value: 0.93,
        dod: 0.02,
        dodPct: 2.2,
        editor: "マコト",
        explanation:
          "前日比 +2.20% で 0.93%、日銀会合 5/16-17 前の催促相場、市場は「政策修正シナリオ」を一部織り込み始め。Insight #16 (JGB × 円建て LNG) の月次相関 r=0.65 から、金利上昇は中期的に円建て LNG 価格緩和に寄与するが、短期的には日銀の YCC 撤廃 + 短期金利据え置きのコミュニケーションがブレた場合に金利乱高下リスク。",
      },
      {
        indicatorId: "us-cpi-yoy",
        label: "米 CPI YoY",
        unit: "%",
        value: 3.4,
        dod: null,
        dodPct: null,
        editor: "マコト",
        explanation:
          "月次更新なし、Fed メンバー発言を注視。次回 6/11 (水) 5 月分公開、Fed の利下げ観測は CME FedWatch で 9 月 (確率 62%) + 12 月 (確率 78%) が主流。Insight #41 (Fed FF rate × JEPX 東京) で示した「金利差 → 円安 → 燃料コスト → JEPX 東京」の 4 段階連鎖は本日 JEPX 急騰の文脈で再確認された。",
      },
    ],
  },

  "2026-05-16": {
    date: "2026-05-16",
    weekday: "土",
    weekend: true,
    generatedAt: "2026-05-16T07:00:00+09:00",
    alerts: [],
    relatedInsightSlugs: [
      "temp-vs-price",
      "jgb-vs-yen-lng",
      "spread-us-jp-10y-vs-fx",
    ],
    weekendNote:
      "今週は 5 系列すべて上昇、特に JEPX 東京 +5.4% と JGB 10y +3.3% が顕著。日銀政策修正観測 (5/16-17 会合) + 関東地方の電力需給ひっ迫が同時要因。来週注目は ① 日銀会合結果 (5/17 終値) ② 関東地方の天候 (週末晴天で太陽光回復見込み)。",
    lines: [
      {
        indicatorId: "jepx-spot-tokyo",
        label: "JEPX 東京 (週間)",
        unit: "¥/kWh",
        value: 9.55,
        dod: 0.49,
        dodPct: 5.41,
        editor: "ハル",
        explanation:
          "週間変化率 +5.41% (5/8 始値 9.06 → 5/15 終値 9.55)、5 月例年比 +12% の高水準で 1 週間。Insight #1 (温度 × JEPX 東京) + Insight #11 (LNG × JEPX 東京) の両方の経路が同時に効いた週で、関東地方の需給ひっ迫警報 + 燃料費調整制度の上振れ予兆。来週は週末晴天で太陽光回復見込み + 日銀会合の円相場次第。",
      },
      {
        indicatorId: "fuel-crude-wti",
        label: "WTI 原油 (週間)",
        unit: "$/bbl",
        value: 79.12,
        dod: 0.71,
        dodPct: 0.91,
        editor: "ハル",
        explanation:
          "週間変化率 +0.91%、78-79 ドル台レンジ、中東地政学 + 北海油田トラブル + OPEC+ 減産延長観測の 3 要因が複合。来週は 6 月 OPEC+ 会合 (5/30 想定) に向けて材料蓄積、Insight #14 のラグ相関で 3-5 ヶ月後の日本市場影響に注意。",
      },
      {
        indicatorId: "fx-usdjpy-monthly-avg",
        label: "USD/JPY (週間)",
        unit: "¥/$",
        value: 157.08,
        dod: 0.6,
        dodPct: 0.38,
        editor: "マコト",
        explanation:
          "週間変化率 +0.38% で 156 円台 → 157 円台、日米金利差 + 日銀会合期待の織り込みで小幅円安。Insight #35 (日米 10y 金利差 × USD/JPY) の月次相関 r=0.81 と整合、来週日銀政策修正なら 154-155 円試し、据え置きなら 158 円突破リスク。",
      },
      {
        indicatorId: "jgb-10y-yield",
        label: "JGB 10 年 (週間)",
        unit: "%",
        value: 0.93,
        dod: 0.03,
        dodPct: 3.33,
        editor: "マコト",
        explanation:
          "週間変化率 +3.33%、0.90% → 0.93% の催促相場。日銀会合 5/16-17 前の市場は「政策修正シナリオ」を一部織り込み、海外勢の売り + 国内勢の様子見が混在。Insight #16 (JGB × 円建て LNG) で示した連動性が再び効きやすい局面。",
      },
      {
        indicatorId: "us-cpi-yoy",
        label: "米 CPI YoY",
        unit: "%",
        value: 3.4,
        dod: null,
        dodPct: null,
        editor: "マコト",
        explanation:
          "月次、次回 6/11 (水) 5 月分公開予定。今週の Fed メンバー発言は概ねハト派寄り (パウエル議長 + ウィリアムズ NY 総裁が「インフレは緩やかに収束」)、CME FedWatch は 9 月利下げ確率 65% に上昇。",
      },
    ],
  },

  "2026-05-17": {
    date: "2026-05-17",
    weekday: "日",
    weekend: true,
    generatedAt: "2026-05-17T07:00:00+09:00",
    alerts: [],
    relatedInsightSlugs: ["jgb-vs-yen-lng", "spread-us-jp-10y-vs-fx"],
    weekendNote:
      "来週 5/18 (月) は日銀政策決定会合の結果発表、Insight #16 (JGB × 円建て LNG) の月次相関 r=0.65 から、政策修正観測の織り込みが完了するかどうかが焦点。関東地方は週末晴天 + 月曜火曜の最高気温 25-27 度予報、JEPX 東京は再び 9.5 円台に挑む展開を想定。5/17 (日) = EIC Data 機能完成日 + バッファ 14 日 = 6/1 GA 達成への踏切台。",
    lines: [
      {
        indicatorId: "jepx-spot-tokyo",
        label: "JEPX 東京 (週末)",
        unit: "¥/kWh",
        value: 9.55,
        dod: null,
        dodPct: null,
        editor: "ハル",
        explanation:
          "土曜と同値 (週末は取引なし)、週明け 5/18 (月) は関東地方の月火曜 25-27 度予報 + 週末晴天で太陽光回復見込み、9.5 円台前後の推移を想定。Insight #1 (温度 × JEPX 東京) で示した「気温 → 需要 → 価格」の経路が引き続き主要ドライバー。",
      },
      {
        indicatorId: "fuel-crude-wti",
        label: "WTI 原油 (週末)",
        unit: "$/bbl",
        value: 79.12,
        dod: null,
        dodPct: null,
        editor: "ハル",
        explanation:
          "土曜と同値、来週の OPEC+ 会合準備材料が出やすい局面、79-80 ドル台のレンジ想定。Insight #14 (Brent → JEPX 東京 ラグ相関) で示した 3-5 ヶ月後の伝播経路で、年末年始の燃料費調整制度に影響予測。",
      },
      {
        indicatorId: "fx-usdjpy-monthly-avg",
        label: "USD/JPY (週末)",
        unit: "¥/$",
        value: 157.08,
        dod: null,
        dodPct: null,
        editor: "マコト",
        explanation:
          "土曜と同値、5/18 (月) 朝の市場再開時に日銀会合織り込みで動意。Insight #35 (日米 10y 金利差 × USD/JPY) で示した r=0.81 から、政策修正なら 154-155 円試し、据え置きなら 158 円突破リスク。",
      },
      {
        indicatorId: "jgb-10y-yield",
        label: "JGB 10 年 (週末)",
        unit: "%",
        value: 0.93,
        dod: null,
        dodPct: null,
        editor: "マコト",
        explanation:
          "土曜と同値、5/18 (月) 日銀会合結果次第で 0.85% (据え置きシナリオ) 〜 1.00% (政策修正シナリオ) のレンジ想定。Insight #16 + Insight #37 (米 30y × JGB 30y) で示した連動性が会合後の動きの解釈に有用。",
      },
      {
        indicatorId: "us-cpi-yoy",
        label: "米 CPI YoY",
        unit: "%",
        value: 3.4,
        dod: null,
        dodPct: null,
        editor: "マコト",
        explanation:
          "月次、次回 6/11 (水) 5 月分公開予定。今週末の Fed メンバー発言なし、来週は地区連銀総裁 4 名のスピーチ予定。",
      },
    ],
  },
};
