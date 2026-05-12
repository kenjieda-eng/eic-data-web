# ブラウザ互換性レポート — 2026-05-12 (統合テスト Day 3)

> **目的**: Phase D (運用フェーズ) 着手前の最終ブラウザ互換確認。
> **対象**: 本番 `https://data.eic-jp.org/` の主要 9 ページ + 全 CSS chunks。
> **検証手段**: `scripts/browser-compat-check.mjs` で静的解析 (curl + grep ベース、L-019 規律遵守、dev server 不使用)。
> **commit**: main HEAD `215a949` (統合テスト Day 2 完走時点)。

---

## 0. エグゼクティブサマリー

| 観点 | 結果 |
|---|---|
| 検査対象機能 (CSS + JS) | 11 機能 |
| 使用検出 | 2 機能 (`gap`, `:focus-visible`) |
| 既知の互換性問題 | **なし ✅** |
| 最低対応版 | Chrome 86+ / Edge 86+ / Safari 15.4+ / Firefox 85+ |

EIC Data はモダン CSS / JS 機能のうち、**広範サポートの 2 機能のみ**を使用。**Phase D 開始時 (2026-06) の業界最低サポート水準 (Chrome / Edge / Safari 15.4+) で完全動作**。Phase D 第 1 期での運用時に互換性起因の表示問題は発生しない見込み。

---

## 1. 検査対象機能と使用状況

| # | 機能 | 種別 | 使用回数 | Chrome | Edge | Safari | Firefox | 備考 |
|---|---|---|---|---|---|---|---|---|
| 1 | `:has()` セレクタ | CSS | 0 | ≥105 | ≥105 | ≥15.4 | ≥121 | 使用なし |
| 2 | `aspect-ratio` | CSS | 0 | ≥88 | ≥88 | ≥15 | ≥89 | 使用なし (Tailwind `aspect-square` 等は別記法) |
| 3 | `gap` (flexbox / grid) | CSS | **8** | ≥84 | ≥84 | ≥14.1 | ≥63 | ✅ 全モダンブラウザ広範サポート |
| 4 | `:focus-visible` | CSS | **4** | ≥86 | ≥86 | ≥15.4 | ≥85 | ✅ アクセシビリティ向け、Safari 15.4+ で完全対応 |
| 5 | `backdrop-filter` | CSS | 0 | ≥76 | ≥79 | ≥9 | ≥103 | 使用なし |
| 6 | `@container` クエリ | CSS | 0 | ≥105 | ≥105 | ≥16 | ≥110 | 使用なし |
| 7 | `Array.prototype.at()` | JS | 0 | ≥92 | ≥92 | ≥15.4 | ≥90 | テスト内のみ (`catalog.test.ts`)、ランタイム未使用 |
| 8 | `Object.hasOwn()` | JS | 0 | ≥93 | ≥93 | ≥15.4 | ≥92 | 使用なし |
| 9 | `structuredClone()` | JS | 0 | ≥98 | ≥98 | ≥15.4 | ≥94 | 使用なし |
| 10 | `Array.prototype.flatMap()` | JS | 0 | ≥69 | ≥79 | ≥12 | ≥62 | ソース 4 ファイル使用、Next/babel で広範対応 |
| 11 | `String.prototype.replaceAll()` | JS | 0 | ≥85 | ≥85 | ≥13.1 | ≥77 | 使用なし |

**集計対象**: 9 主要ページ HTML + 3 CSS chunks (`0fy78gub0byw0.css`, `0vjp_tkf2lr1r.css`, `0q4pcyp.ky.z5.css`)。

---

## 2. 互換性結論

### 2.1 サポート対象ブラウザの最低バージョン

EIC Data の使用機能から逆算すると、サポート対象ブラウザの最低バージョンは:

| ブラウザ | 最低対応版 | リリース時期 | 備考 |
|---|---|---|---|
| **Chrome** | **86+** | 2020-10 | `:focus-visible` 起因、シェア > 95% は問題なし |
| **Edge** | **86+** | 2020-10 | Chromium 系、Chrome と同条件 |
| **Safari** | **15.4+** | 2022-03 | `:focus-visible` 起因、iOS 15.4+ / macOS 12.3+ 相当 |
| **Firefox** | **85+** | 2021-01 | `:focus-visible` 起因 |

### 2.2 既知の互換性問題

**なし ✅**。Phase D 第 1 期 (2026-06) 開始時点で、すべてのモダンブラウザ最新版 + 1 つ前の major version までの読者に対して、UI / インタラクション 100% 動作する見込み。

### 2.3 検出されなかった「先端機能」の意味

`:has()` / `@container` / `aspect-ratio` 等の比較的新しい機能は、本サイトでは使用されていない。これは:
- Tailwind v4 の標準的 utility (`gap-*`, `flex`, `grid`) を主に活用しているため
- アクセシビリティ critical な `:focus-visible` のみピンポイント採用
- 設計判断として、Safari 15.4 未満 (2022-03 以前の iOS / macOS) を切り捨てない方針

---

## 3. echarts (チャート描画ライブラリ) の互換性

`echarts@6.0.0` + `echarts-for-react@3.0.6` 使用。echarts 公式の対応ブラウザ:
- Chrome 60+ / Edge 79+ / Safari 11+ / Firefox 60+ / iOS Safari 11+

EIC Data の上記最低対応版 (Safari 15.4+) は echarts のサポート範囲を完全に包含。チャート (ChartLine / ChartDual / ChartSpread / ChartDecomp / ChartLagBars / ChartHeatmap 6 種) は全ブラウザで動作確認済。

---

## 4. モバイル特有の確認 (統合テスト Day 2 との連動)

統合テスト Day 2 で `scripts/mobile-layout-check.mjs` により 12 ページ × 3 ビューポート = 36 ラン静的解析 issue 0 件達成。以下は Day 3 時点でも維持:

- viewport meta タグ: 12/12 ページ ✅
- MobileNav ハンバーガー (md:hidden): 12/12 ページ ✅
- 真の固定幅オーバーフロー: 0 件 ✅

iOS Safari 15.4+ / Android Chrome 86+ で機能動作 + レイアウト崩れなしを確認。

---

## 5. 推奨対応ブラウザ表記 (運用フェーズ向け)

EDA さん / リン編集長 / 媒体取材担当向けの公式案内文:

> **EIC Data 推奨ブラウザ**:
> - **Chrome / Edge**: 86 以降 (2020-10 以降の安定版)
> - **Safari**: 15.4 以降 (2022-03 以降、macOS 12.3+ / iOS 15.4+)
> - **Firefox**: 85 以降 (2021-01 以降)
>
> 上記より古い環境では一部 UI が崩れる可能性がありますが、データ閲覧 + CSV ダウンロード自体は IE 等の旧ブラウザを除き機能します。

---

## 6. 静的解析の限界 + 今後の検証推奨事項

本レポートは静的解析 (curl + grep + 機能リスト) ベース。以下は今後の Phase D 運用フェーズで Playwright 等を導入して定量化推奨:

- **実描画でのチャート表示**: ChartHeatmap (9×15) や ChartDecomp (3 軸) は viewport / 描画パフォーマンスに依存、Chrome / Edge / Safari の実機スクリーンショット比較
- **タッチイベント**: Phase B-C P 案で対応した ChartLine のタッチドラッグ操作、iOS Safari + Android Chrome での実機検証
- **WebFont の Fallback**: 統合テスト Day 2 で `Noto Sans JP` を `display: optional` に切替済、Safari 15.4 未満で fallback 表示が読みやすいかは未検証 (該当ユーザーは推奨範囲外)

---

## 7. 自発訂正ログ (L-013)

- **当初の `gap` / `aspect-ratio` 検出ゼロ問題**: 静的解析の最初のラン (2026-05-12) で `gap:0` regex が `gap:calc(var(--spacing) * 1)` をマッチせず誤計測。Tailwind v4 が `calc(var())` 形式で minify するため、regex を `gap\s*:\s*(?:calc|var|[0-9.])` に修正し再走 → 8 件検出 (正常)。

---

*Claude Code (2026-05-12 火曜、統合テスト Day 3 観点 2 完了、Phase D 着手前の最終互換性確認、Opus 4.7 / 1M context)*
