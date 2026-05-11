# EIC Data — Insight 執筆ガイド (Phase C Day 1 確立、平日毎日 1 本の D-007 約束を持続するための運用基盤)

> **作成**: 2026-05-12 (Phase C Day 1、リン編集長)
> **対象読者**: リン + マコト + ハル + ユウ + ゲスト執筆者
> **目的**: Phase B-A で 41 本を量産した経験を体系化、Phase C 以降の毎日更新を「テンプレ + チェックリスト + バリデータ」の 3 点セットで持続可能化する

---

## 1. 編集軸の選定

Insight は **6 つの編集軸** のいずれか 1 つを主軸として執筆する (副軸を 1 個まで持つことは可)。

| 軸 (group id) | 内容 | 担当ペルソナ目安 |
|---|---|---|
| **energy** (weather-x-power) | 気象 × 電力の核 (JEPX 9 エリア × 気温 / 日照 / 風速 / 降水量) | ハル |
| **fuel-finance** | LNG / 原油 / 石炭 / 為替 / JGB の伝播経路 | マコト |
| **power-mix** | 電源構成 (再エネ / 原発 / 火力) | ハル |
| **climate-geography** | 9 地点ヒートマップ (日照 / 風速 / 積雪 / 降水量 / 平均気温) | ユウ |
| **demand-water** | 需要側 + 水力 + 降水量 | ユウ |
| **macro** | 米マクロ × 日本エネルギー (CPI / FF rate / 米鉱工業生産 / Treasury yields / 日米金利差) | マコト |

主軸を決めると `INSIGHT_GROUPS` (`src/lib/grouping.ts`) のどの slugs 配列に加えるかが自動的に決まる。

---

## 2. 系列の選定

catalog 105 系列から **2-5 系列** を選定。多すぎるとチャートが読みにくく、少なすぎると因果連鎖が描けない。

| 系列数 | 想定レンダラ | 例 |
|---|---|---|
| 2 系列 | ChartLine × 2 / ChartDual | 米 CPI × USD/JPY (Insight #40) |
| 2 系列 (lag) | ChartLagBars | TTF → 日本 LNG (Insight #14) |
| 2 系列 (decomp) | ChartDecomp | 火力 × LNG 燃料コスト要因分解 (Insight #29) |
| 9 系列 (heatmap) | ChartHeatmap | 9 地点 × 36 ヶ月 (Insight #26-#28 等) |
| 2 系列 (spread) | ChartSpread | 日米 10y 金利差 (Insight #35) |

catalog 一覧 URL: <https://data.eic-jp.org/catalog>

---

## 3. レンダラ使い分け早見表

| レンダラ | props (実装 API、本リポ確認済) | 用途 | 例 slug |
|---|---|---|---|
| `ChartLine` | `id` + 任意 `title` / `color` / `height` / `showZoom` | 単一系列の時系列 | `temp-vs-price` |
| `ChartDual` | `leftId` + `rightId` + `leftAxisName` + `rightAxisName` + `freq` | 2 軸 (単位違い、左右独立スケール) | `lng-vs-price-tokyo` |
| `ChartLagBars` | `leadId` + `lagId` + 任意 `maxLag` (既定 12) + `highlightPeak` | ラグ相関 (リード → ラグの最大相関 月) | `brent-lag-vs-price-tokyo` |
| `ChartDecomp` | `qtyId` + `priceId` + `baseMonth` 等 | 3 要因加法分解 (ΔQ + ΔP + ΔQ·ΔP) | `thermal-fuel-cost-decomp` |
| `ChartHeatmap` | `idPattern` (`temp-{region}`) + `regions` 配列 + `months` | 地域 × 月のヒートマップ | `temp-9-region-heatmap` |
| `ChartSpread` | `longId` + `shortId` + 派生スプレッド | スプレッド (米 10y - 日 10y 等) | `spread-us-jp-10y-vs-fx` |

⚠️ **L-013 注意**: 原稿執筆時にレンダラの props を誤ると build エラー。**実装ファイル** (`src/components/Chart*.tsx`) の props 型を必ず参照する (議事録の例示はしばしば古い)。

---

## 4. 引用フォーマット 3 形式

各 Insight 末尾に **BibTeX / Chicago 17 / APA 7** の 3 形式を併記。Phase C スコープ 3 で自動生成予定だが、当面は手書きでテンプレートに従う。

サンプルは `src/content/insight-template.mdx` 末尾を参照。

---

## 5. 執筆チェックリスト 10 項目 ⭐

PR を出す前にすべて self-check:

1. ☐ **slug** は ASCII kebab-case で 4-40 文字、既存 41 本と重複しない
2. ☐ **title** は **40 字以内**、結論または問いを 1 行で示す
3. ☐ **description** は **160 字以内**、OGP / SNS 共有時の文面として読みやすい
4. ☐ **publishedAt** は ISO 8601 YYYY-MM-DD、過去または当日
5. ☐ **tags** は **3-5 個**、日本語、既存 tags (`src/lib/insights.ts` 参照) と整合
6. ☐ **indicators** は catalog 系列 ID で **2-5 個**、`https://data.eic-jp.org/catalog` で存在確認済
7. ☐ **renderer** は実装 API に揃った形で呼び出す (§3 早見表に従う)
8. ☐ **5 章構成** (導入 / データ / 解釈 / 注意点 / 出典) を守る、章名を変えない
9. ☐ **一次ソース URL** を出典セクションで明示 (D-002 + D-005、二次出典は補助のみ)
10. ☐ **r 値書く時は期間 + ラグ + 季節調整の有無を明示** (L-010 統計注意)

加えて、`src/lib/insights.ts` の INSIGHTS 配列にエントリを追加し、必要なら `src/lib/grouping.ts` の該当 group の `slugs` 配列に slug を加える。

---

## 6. ChartXxx の props API リファレンス (実装 API、本リポ確認済)

最新 props は **必ず実装ファイル** から確認:

- `src/components/ChartLine.tsx` → `ChartLineProps`
- `src/components/ChartDual.tsx` → `ChartDualProps`
- `src/components/ChartLagBars.tsx` → `ChartLagBarsProps` (例: `leadId`, `lagId`, `maxLag` — `id` + `title` のような誤った props を渡さない、L-013)
- `src/components/ChartDecomp.tsx` → `ChartDecompProps`
- `src/components/ChartHeatmap.tsx` → `ChartHeatmapProps`
- `src/components/ChartSpread.tsx` → `ChartSpreadProps`

⚠️ Phase B-A Day 13 で発見された L-013 事例: 原稿側で `<ChartLagBars id="..." title="..." />` を書いていたが、実装は `leadId` + `lagId` を要求 → 修正してから merge。

---

## 7. tags 規約 (日本語 3-5 個)

- 必ず日本語
- 主軸タグ (電力 / 燃料 / 金融 / 気象 / マクロ / 再エネ等) を 1 つ含める
- 地域タグ (東京 / 北海道 / 九州 / 全国 等) は該当時のみ
- 系列名タグ (LNG / JGB / USD/JPY / FRB 等) は該当時のみ
- 構造タグ (ラグ相関 / 要因分解 / ヒートマップ / 景気サイクル) は該当時のみ

既存 tags 一覧 (Phase B-A Day 13 末時点):

> 電力 / 気象 / 燃料 / 金融 / 為替 / 金利 / 需要 / 再エネ / マクロ / 東京 / 北海道 / 北陸 / 関西 / 中部 / 中国 / 四国 / 九州 / 東北 / 全国 / LNG / TTF / 原油 / 石炭 / JGB / USD/JPY / FRB / JEPX / CPI / インフレ / 鉱工業生産 / 太陽光 / 風力 / 水力 / 原発 / ベースロード / 火力 / エネルギー基本計画 / 雪国 / 豪雪 / 製造業 / 夏期 / 降水量 / 気温 / ラグ相関 / 要因分解 / ヒートマップ / スプレッド / 景気サイクル / 超長期

新タグ追加時は既存と意味重複しないか確認。

---

## 8. relatedInsights 選定基準

新 Insight の `relatedInsights` に **2-4 個** を選ぶ際:

1. **tag マッチスコア**: 共通タグ数で並べ替え
2. **編集軸マッチ**: 同じ INSIGHT_GROUPS グループの slug を優先
3. **因果連鎖**: 上流 (本記事の前段にあたる Insight) または下流 (本記事の後段で扱われる Insight)
4. **シリーズ完結**: Phase B-A の連番シリーズ (例: lng-vs-price / lng-lag-vs-price / brent-lag-vs-price / ttf-lag-vs-lng-jp) を優先

実装支援: `findRelatedInsightsForDomain` (`src/app/domain/data.ts`) は domain ベース、`groupInsights` (`src/lib/grouping.ts`) は group ベースで自動抽出。両者を参考にしつつ最終判断は編集者。

---

## 9. レビューフロー (GitHub PR ベース)

1. **リン草稿** (or マコト / ハル / ユウ): `feat/insight-<slug>` ブランチで PR、frontmatter チェックリスト self-check
2. **マコト確認** (金融 / マクロ系) or **ハル確認** (エネルギー系): PR コメントで factual review
3. **リク監修** (引用部分): 一次ソース URL + ライセンス + 表記が D-002 + D-005 準拠か検証
4. **ナギ UX レビュー**: チャート構成 + 文章の読みやすさ (見出し階層 + 文字数)
5. **CI green**: vitest 全 PASS + Lighthouse CI 5 URL 全 90+
6. **squash merge** → main 自動デプロイ (Vercel) → EDA さん本番確認 (L-014)

---

## 10. PR チェックリスト (merge 前 self-check)

- ☐ vitest PASS (insight-validator + grouping + insights count)
- ☐ Lighthouse CI 5 URL assert success (L-020 規律、URL 数 5 維持)
- ☐ frontmatter バリデータ通過 (`src/lib/insight-validator.ts`)
- ☐ `src/lib/insights.ts` の INSIGHTS 配列にエントリ追加済
- ☐ `src/lib/grouping.ts` の該当グループに slug 追加済 (もしくは意図的に unclassified)
- ☐ pnpm build SSG ページ生成成功 (L-019 dev 起動禁止、build + test のみ)
- ☐ 一次ソース URL の `curl` で 200 OK を本人確認済
- ☐ MDX 内の `<ChartXxx>` props が実装 API と一致 (L-013 警戒)
- ☐ 5 章構成を守る + 章名を変えない
- ☐ commit message に Co-Authored-By: Claude (規約)

---

## 11. 平日毎日 1 本の体制 (D-007 維持、Phase C 期間)

Phase C 期間中の分担:

- **リン編集長**: 週 2 本 (北極星軸: 金融 × エネルギー横断、編集軸調整)
- **マコト**: 週 1 本 (金融市場 / マクロ系)
- **ハル**: 週 1 本 (エネルギー市場 / 制度系)
- **ユウ**: 隔週 1 本 (データサイエンス系 / ヒートマップ系)
- **残り**: ゲスト執筆 / 季節ネタ

執筆 → レビュー → merge を **1 営業日以内** で完結させ、平日 17:00 までに公開。GA 達成後の運用 (Phase D) でも継続。

---

## 12. 関連ドキュメント

- `src/content/insight-template.mdx` — MDX テンプレート本体
- `src/lib/insight-validator.ts` — frontmatter 自動検証
- `src/lib/insights.ts` — INSIGHTS 配列
- `src/lib/grouping.ts` — 6 軸グループ定義
- `docs/phase-c-design.md` §1 — Phase C 6 大スコープ全体像

---

*Phase C Day 1 (2026-05-12、リン編集長 + マコト + ハル) で確立。Phase C 全 6 日間 + GA (2026-06-01) 後の Phase D 平日更新でも継続運用。*
