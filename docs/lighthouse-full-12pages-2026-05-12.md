# Lighthouse 全 12 主要ページ最終確認 — 2026-05-12 (統合テスト Day 3)

> **目的**: 統合テスト Day 1+2 で測定済 5 URL に加え、残り 7 URL も含めた**全 12 主要ページの完全な Lighthouse 結果取得**。Phase D (運用フェーズ) 着手前の最終品質確認。
> **対象 commit**: `chore/integration-test-day-3` HEAD `a5b9457` (/search CLS hotfix 適用後)
> **L-020 規律維持**: 既存 `.lighthouserc.json` (5 URL) は変更せず、`.lighthouserc.day3.json` (7 URL) を `workflow_dispatch` で個別実行
> **対応ブラウザ**: Lighthouse 12 (Chrome ベース)、preset `desktop`、各 URL 3 回測定の median

---

## 0. エグゼクティブサマリー

| 観点 | 結果 |
|---|---|
| 測定 URL 数 | **12 / 12** (主要ページ 100% カバー) |
| Performance 95+ 達成 | **9 / 12** (75%、最低 0.93) |
| Performance 90+ 達成 | **12 / 12** (100%) |
| Accessibility 95+ 達成 | **12 / 12** (100%) |
| Best Practices 100 達成 | **12 / 12** (100%) |
| SEO 100 達成 | **12 / 12** (100%) |
| CLS ≤0.1 達成 | **12 / 12** (100%) |
| Lighthouse CI assertion (warn at minScore 0.9) | **全 12 URL pass** |

🎯 **全 12 主要ページで Lighthouse 4 カテゴリ全て 0.9 以上 + CLS ≤0.1 を達成**。本番品質は媒体取材 + 研究者引用 + 大規模告知に耐える水準。

---

## 1. 全 12 URL 結果テーブル (median of 3 runs)

| # | URL | Perf | A11y | BP | SEO | CLS | 計測元 |
|---|---|---|---|---|---|---|---|
| 1 | `/` | **0.98** | **1.00** | **1.00** | **1.00** | 0.012 | run 25716041102 (5 URL regression) |
| 2 | `/today` | **0.98** | **0.98** | **1.00** | **1.00** | 0 | run 25716042118 (7 URL day3) |
| 3 | `/insight` | **0.93** | **1.00** | **1.00** | **1.00** | 0 | run 25716042118 |
| 4 | `/insight/map` | **0.95** | **0.98** | **1.00** | **1.00** | 0 | run 25716041102 |
| 5 | `/catalog` | **0.97** | **1.00** | **1.00** | **1.00** | 0 | run 25716041102 |
| 6 | `/data-quality` | **0.97** | **0.96** | **1.00** | **1.00** | 0 | run 25716041102 |
| 7 | `/search` | **0.99** | **1.00** | **1.00** | **1.00** | 0.030 | run 25716042118 (Day 3 hotfix 後) |
| 8 | `/methodology` | **0.98** | **1.00** | **1.00** | **1.00** | 0 | run 25716042118 |
| 9 | `/glossary` | **0.98** | **1.00** | **1.00** | **1.00** | 0 | run 25716041102 |
| 10 | `/privacy` | **0.98** | **1.00** | **1.00** | **1.00** | 0 | run 25716042118 |
| 11 | `/terms` | **0.99** | **1.00** | **1.00** | **1.00** | 0 | run 25716042118 |
| 12 | `/citation-policy` | **0.97** | **1.00** | **1.00** | **1.00** | 0 | run 25716042118 |
| | **平均** | **0.972** | **0.99** | **1.00** | **1.00** | **0.004** | — |

---

## 2. Day 3 で発見 + 即時解消した課題 — `/search`

### 2.1 1 回目測定 (HEAD `e60a3e6`、/search 修正前)

| 指標 | 1 回目実測 | 期待値 | 判定 |
|---|---|---|---|
| Performance | 0.75 ⚠️ | ≥0.9 | warn |
| CLS | 0.808 ⚠️ | ≤0.1 | warn (実測 8 倍超過) |

LHR の `layout-shifts.items` を解析:
- shift element: `<main > div.mx-auto>` (高さ **18561px** = ページが異常に長い)
- shift score: 0.808

### 2.2 根本原因

`src/app/search/SearchClient.tsx` で **空クエリ時に全 169 entries (105 indicator + 41 insight + 23 glossary) を初期描画**していた。

```ts
// 修正前: searchEntries({query:""}) は全 entries を返す
const fullResult = useMemo(
  () => searchEntries(index, { query, category: null }),
  [index, query],
);
```

Suspense fallback ("検索ボックスを準備中...") から、ハイドレーション後の **18561px の結果リスト** への遷移で **CLS 0.808** を発生。さらに 169 件の `<li>` レンダリングで **TBT 増 → Performance 0.75**。

設計意図 (placeholder 文言「キーワードを入力すると...探せます」) とも矛盾していた。

### 2.3 修正 (`a5b9457`)

```diff
- const fullResult = useMemo(
-   () => searchEntries(index, { query, category: null }),
-   [index, query],
- );
+ const trimmedQuery = query.trim();
+ const fullResult = useMemo(
+   () =>
+     trimmedQuery
+       ? searchEntries(index, { query: trimmedQuery, category: null })
+       : { entries: [], counts: index.totals, truncated: false },
+   [index, trimmedQuery],
+ );
```

タブカウントは `index.totals` (169/105/41/23) で情報量を維持しつつ、初期 entries を空に。

### 2.4 2 回目測定 (HEAD `a5b9457`、/search 修正後)

| 指標 | 2 回目実測 | 差分 | 判定 |
|---|---|---|---|
| Performance | **0.99** | **+0.24** | ✅ pass |
| CLS | **0.030** | **-0.778** | ✅ pass |

vitest `search-index.test.ts` 8/8 PASS で lib 側の検索ロジック不変を確認済。

---

## 3. Day 1+2+3 を通じた Lighthouse 改善ジャーニー

| URL | Day 1+2 (5/12 23:07) | Day 3 (5/12 14:53 JST) | 変化 |
|---|---|---|---|
| `/data-quality` Perf | 0.83 ⚠️ → 0.97 (Day 2) | **0.97** | Day 2 維持 ✅ |
| `/data-quality` A11y | 0.87 ⚠️ → 0.96 (Day 2) | **0.96** | Day 2 維持 ✅ |
| `/data-quality` CLS | 0.314 ⚠️ → 0 (Day 2) | **0** | Day 2 維持 ✅ |
| `/catalog` A11y | 0.89 ⚠️ → 1.00 (Day 2) | **1.00** | Day 2 維持 ✅ |
| `/search` Perf | 未測定 | 0.75 ⚠️ → **0.99** (Day 3) | Day 3 解消 ✅ |
| `/search` CLS | 未測定 | 0.808 ⚠️ → **0.030** (Day 3) | Day 3 解消 ✅ |

---

## 4. Lighthouse CI assertion 結果

両ラン (5 URL + 7 URL) ともに **assertion warn 0 件** で `success` conclusion。

```
GitHub Actions run 25716041102 (pull_request, 5 URL): success ✅
GitHub Actions run 25716042118 (workflow_dispatch, 7 URL): success ✅
```

---

## 5. 統合テスト Day 1+2+3 で測定した Lighthouse run の系譜

| 日付 | run ID | trigger | URLs | 結果 |
|---|---|---|---|---|
| 2026-05-11 23:07 | 25702648307 | push to main (Day 1 commit) | 5 (基本) | 3/5 pass + 2/5 warn |
| 2026-05-12 05:24 (UTC) | (Day 2 PR #33 run) | pull_request | 5 (基本) | 5/5 pass (Day 2 修正後) |
| 2026-05-12 05:40 (UTC) | 25715765589 | pull_request (Day 3 PR #34 initial) | 5 (基本) | 5/5 pass (regression check) |
| 2026-05-12 05:40 (UTC) | 25715747141 | workflow_dispatch (Day 3 7 URL initial) | 7 (Day 3) | 6/7 pass + /search warn |
| 2026-05-12 05:48 (UTC) | 25716041102 | pull_request (Day 3 PR #34 search fix) | 5 (基本) | **5/5 pass** ✅ |
| 2026-05-12 05:48 (UTC) | 25716042118 | workflow_dispatch (Day 3 7 URL search fix) | 7 (Day 3) | **7/7 pass** ✅ |

---

## 6. 自発訂正ログ (L-013)

- **/search Day 1 + Day 2 未測定の盲点**: `.lighthouserc.json` の 5 URL に `/search` が含まれていなかったため、Day 1+2 では `/search` の Performance / CLS の警告状態を検知できていなかった。Day 3 で `.lighthouserc.day3.json` 経由で初測定 → 0.75/0.808 を発見 → 同日中に hotfix 適用 → 0.99/0.030 達成。**L-020 規律の「5 URL 上限」**は CI コスト最適化として正しいが、運用フェーズ前には全主要 URL の 1 回限り測定が必要であることが明確化された。

---

*Claude Code (2026-05-12 火曜、統合テスト Day 3 観点 3 完了、12 主要ページ完全 Lighthouse pass 達成、Opus 4.7 / 1M context)*
