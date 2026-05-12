# Phase D 第 1 期 catalog 追加 ~10 系列 調査レポート

> **作成**: 2026-05-12 (火) 大規模告知準備 Day 1
> **対象**: Phase D 第 1 期 (2026-06-02 〜 2026-06-30) で追加予定の 10 系列
> **位置づけ**: Phase D 第 1 期 22 本の Insight 候補 (`docs/phase-d-period-1-insight-candidates-2026-06.md`) で参照される新規データ系列のソース・ライセンス・取得方法を Phase D 着手前に確定
> **方針**: 優先度「高」4 系列を最優先確定、「中」4 系列は 5/14-5/24 で並行調査、「低」2 系列は Phase D 第 2 期 (7 月) へ持ち越し可

---

## 0. エグゼクティブサマリー

| カテゴリ | 系列数 | 優先度 | 状況 |
|---|---|---|---|
| 米国マクロ (FRED 経由) | 4 | 高 〜 中 | ライセンス public domain 確定、FRED API キー流用で即時着手可 |
| 欧州マクロ (ECB / Eurostat) | 2 | 高 〜 中 | ECB は SDMX 形式 API、ライセンス open / 商用利用条件あり |
| 日本マクロ (日銀) | 1 | 高 | 日銀短観 = BOJ time-series data search、CSV 取得可 |
| 中国マクロ (公的指標) | 1 | 中 | 中国国家統計局 PMI、英訳版は商用利用条件あり |
| 燃料市場 (鉄鋼石) | 1 | 中 | World Bank Pink Sheet (既存 fuel-coal-au と同ソース) |
| 燃料市場 (木質燃料) | 1 | 低 | ソース未確定、Phase D 第 2 期へ持ち越し検討 |

**結論**: 優先度「高」の 4 系列 (US Nonfarm Payrolls / ECB 政策金利 / 日銀短観 / 米国失業率) は Phase D 着手 (5/26 以降) で確実に追加可能。残り 6 系列は 5/14-5/24 の調査で確定 or 持ち越し判断。

---

## 1. 系列別調査結果

### 1.1 US Nonfarm Payrolls (米国非農業部門雇用者数)

| 項目 | 内容 |
|---|---|
| **優先度** | 高 (Insight #43 で使用) |
| **ソース** | FRED (連邦準備銀行) `PAYEMS` シリーズ |
| **一次出典** | US Bureau of Labor Statistics (BLS), Current Employment Statistics |
| **ソース URL** | <https://fred.stlouisfed.org/series/PAYEMS> |
| **ライセンス** | public domain (US Federal Government data) |
| **CC BY 4.0 互換** | ✅ (public domain → CC BY 4.0 で再配布可) |
| **取得頻度** | 月次、毎月第 1 金曜日 21:30 JST 発表 |
| **取得方法** | FRED API `https://api.stlouisfed.org/fred/series/observations?series_id=PAYEMS&api_key=...&file_type=json` |
| **既存スクリプト** | `fetch_us_macro.py` (us-cpi-yoy 等で実績あり) を流用、`series_id` を `PAYEMS` に変更 |
| **freshness_sla_days** | 35 日 (月次データの遅延許容、既存マクロと同基準) |
| **id 案** | `us-nonfarm-payrolls` |

### 1.2 ECB 政策金利 (Main Refinancing Rate)

| 項目 | 内容 |
|---|---|
| **優先度** | 高 (Insight #48 で使用) |
| **ソース** | ECB Statistical Data Warehouse |
| **一次出典** | European Central Bank, Monetary Policy Decisions |
| **ソース URL** | <https://data.ecb.europa.eu/data/data-categories/financial-markets-and-interest-rates/ecb-policy-rates> |
| **ライセンス** | ECB free use, but **複製時は出典明示必須** (商用利用は申請推奨) |
| **CC BY 4.0 互換** | ⚠️ ECB ライセンスは CC BY 4.0 と同等の表示要件、但し**正確な再配布許諾文言を Phase D 着手前にリク監修** |
| **取得頻度** | 不定期 (政策決定会合は約 6 週間ごと、年 8 回) |
| **取得方法** | ECB SDMX 2.1 API、または手動 CSV ダウンロード |
| **既存スクリプト** | 新規 `fetch_ecb_rates.py` 必要 (SDMX クライアント `pandasdmx` を利用) |
| **freshness_sla_days** | 60 日 (不定期発表のため緩め) |
| **id 案** | `ecb-policy-rate-mro` (Main Refinancing Operations rate) |

### 1.3 USD/EUR (ユーロ/ドル為替レート)

| 項目 | 内容 |
|---|---|
| **優先度** | 中 (Insight #48 で使用、ECB 経由) |
| **ソース** | ECB Reference rates (公式日次中値) |
| **一次出典** | European Central Bank, Euro foreign exchange reference rates |
| **ソース URL** | <https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_rates/html/eurofxref-graph-usd.en.html> |
| **ライセンス** | ECB free use (上記 1.2 と同等) |
| **取得頻度** | 平日日次、CET 16:00 |
| **取得方法** | ECB Reference rates XML feed `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml` |
| **既存スクリプト** | 新規 `fetch_ecb_fx.py` 必要 |
| **freshness_sla_days** | 7 日 |
| **id 案** | `fx-eurusd-monthly-avg` (月次平均で集計、既存 `fx-usdjpy-monthly-avg` と整合) |

### 1.4 US CPI Food (消費者物価指数 食料)

| 項目 | 内容 |
|---|---|
| **優先度** | 中 (Insight #51 で使用) |
| **ソース** | FRED `CPIUFDSL` (Food, seasonally adjusted) |
| **一次出典** | US Bureau of Labor Statistics |
| **ソース URL** | <https://fred.stlouisfed.org/series/CPIUFDSL> |
| **ライセンス** | public domain ✅ |
| **取得頻度** | 月次 (CPI 発表と同タイミング) |
| **取得方法** | FRED API (既存スクリプト流用) |
| **freshness_sla_days** | 35 日 |
| **id 案** | `us-cpi-food-yoy` (前年同月比に変換、既存 `us-cpi-yoy` と整合) |

### 1.5 US CPI Energy (消費者物価指数 エネルギー)

| 項目 | 内容 |
|---|---|
| **優先度** | 中 (Insight #51 で使用) |
| **ソース** | FRED `CPIENGSL` (Energy, seasonally adjusted) |
| **一次出典** | US Bureau of Labor Statistics |
| **ソース URL** | <https://fred.stlouisfed.org/series/CPIENGSL> |
| **ライセンス** | public domain ✅ |
| **取得頻度** | 月次 |
| **取得方法** | FRED API (既存スクリプト流用) |
| **freshness_sla_days** | 35 日 |
| **id 案** | `us-cpi-energy-yoy` |

### 1.6 BoJ 短観 業況判断 DI (大企業製造業)

| 項目 | 内容 |
|---|---|
| **優先度** | 高 (Insight #53 で使用) |
| **ソース** | 日本銀行 時系列統計データ検索サイト |
| **一次出典** | Bank of Japan, Tankan Survey |
| **ソース URL** | <https://www.stat-search.boj.or.jp/ssi/cgi-bin/famecgi2?cgi=$nme_a000_en&lstSelection=CO> |
| **ライセンス** | public domain (政府標準利用規約 2.0 = CC BY 4.0 互換) |
| **CC BY 4.0 互換** | ✅ (政府標準利用規約 2.0) |
| **取得頻度** | 四半期 (3 月・6 月・9 月・12 月、月初翌営業日 8:50 JST 発表) |
| **取得方法** | BoJ 時系列データ検索 → CSV ダウンロード (手動 or `fetch_boj.py` 拡張) |
| **既存スクリプト** | `fetch_boj.py` (fx-usdjpy-monthly-avg で実績あり) を拡張 |
| **freshness_sla_days** | 100 日 (四半期データの遅延許容) |
| **id 案** | `boj-tankan-large-mfg-di` |

### 1.7 中国 PMI 製造業 (Caixin or 国家統計局)

| 項目 | 内容 |
|---|---|
| **優先度** | 中 (Insight #55 で使用) |
| **ソース候補 A** | 中国国家統計局 (NBS) Manufacturing PMI |
| **ソース URL** | <http://www.stats.gov.cn/english/PressRelease/> |
| **ライセンス A** | NBS data 利用には**個別申請が必要**な場合あり、CC BY 4.0 再配布は要確認 |
| **ソース候補 B** | TradingEconomics API (商用) |
| **取得頻度** | 月次、毎月最終日 |
| **判断** | ⚠️ **ライセンス確認 + リク監修待ち**。最悪 Phase D 第 1 期 #55 は中国 PMI 抜きで再構成 (鉄鋼石 + 石炭の 2 軸) |
| **id 案 (確定時)** | `china-mfg-pmi-nbs` |

### 1.8 鉄鋼石価格 (Iron Ore)

| 項目 | 内容 |
|---|---|
| **優先度** | 中 (Insight #55 で使用) |
| **ソース** | World Bank Pink Sheet "Iron ore" (既存 `fuel-coal-au` と同ソース) |
| **一次出典** | World Bank Commodity Markets Outlook |
| **ソース URL** | <https://www.worldbank.org/en/research/commodity-markets> |
| **ライセンス** | CC BY 4.0 ✅ (既存 fuel-coal-au で利用実績あり) |
| **取得頻度** | 月次、月末 |
| **取得方法** | World Bank Pink Sheet Excel ダウンロード (`fetch_worldbank_pinksheet.py` 既存) |
| **既存スクリプト** | 既存スクリプト流用、`series_name` を `Iron ore` に変更 |
| **freshness_sla_days** | 45 日 |
| **id 案** | `fuel-iron-ore-monthly` (`fuel-` プレフィックスは既存ドメイン分類踏襲) |

### 1.9 米国失業率 (Unemployment Rate)

| 項目 | 内容 |
|---|---|
| **優先度** | 高 (Insight #58 で使用) |
| **ソース** | FRED `UNRATE` |
| **一次出典** | US Bureau of Labor Statistics |
| **ソース URL** | <https://fred.stlouisfed.org/series/UNRATE> |
| **ライセンス** | public domain ✅ |
| **取得頻度** | 月次 (Nonfarm Payrolls と同日発表) |
| **取得方法** | FRED API (既存スクリプト流用) |
| **freshness_sla_days** | 35 日 |
| **id 案** | `us-unemployment-rate` |

### 1.10 木質燃料指数 (Wood Fuel Price Index)

| 項目 | 内容 |
|---|---|
| **優先度** | 低 (Insight #57 で使用) |
| **ソース候補** | (1) FAO Forestry Statistics, (2) USDA Wood Energy Markets, (3) 林野庁 木質バイオマス利用統計 |
| **ライセンス** | (1) FAO データは出典明示で再配布可 / (2) USDA は public domain / (3) 林野庁は政府標準利用規約 2.0 |
| **判断** | ⚠️ **複数候補の精査が必要**、Phase D 第 2 期 (7 月、ESG 軸) へ持ち越し可。最悪 Insight #57 は CO2 排出原単位の単軸で再構成 |
| **id 案 (確定時)** | `fuel-wood-pellet-index` (候補) |

---

## 2. 既存 fetch スクリプトとの整合性

統合テスト Day 1+2+3 で確認した既存 catalog 105 系列の fetch スクリプト群と比較し、新規追加 10 系列の fetch スクリプト変更点を整理:

| 系列 | 流用可能スクリプト | 必要な変更 |
|---|---|---|
| US Nonfarm Payrolls / 米国失業率 / US CPI Food / US CPI Energy | `fetch_us_macro.py` (既存) | `series_id` 配列に PAYEMS / UNRATE / CPIUFDSL / CPIENGSL を追加、`idToDirectory` map に macro/ を明示 (Day 1 hotfix PR #29 同様の規律) |
| ECB 政策金利 / USD/EUR | (新規) `fetch_ecb.py` | SDMX 2.1 クライアント `pandasdmx` または XML feed parser を実装 |
| BoJ 短観 | `fetch_boj.py` (既存) | 時系列 ID を短観系に拡張、四半期データの観測月対応 (3/6/9/12 月のみ row 生成) |
| 中国 PMI | (要調査) | ライセンス確定後に新規 `fetch_china.py` |
| 鉄鋼石 | `fetch_worldbank_pinksheet.py` (既存) | `series_name` 配列に `Iron ore` を追加 |
| 木質燃料 | (持ち越し) | Phase D 第 2 期で再検討 |

---

## 3. Phase D 着手タイムライン

| 期間 | アクション |
|---|---|
| **5/14-5/19** | 優先度「高」4 系列 (US Nonfarm / 米国失業率 / ECB 政策金利 / BoJ 短観) の fetch スクリプト改修、データ取得テスト |
| **5/20-5/24** | 優先度「中」4 系列 (USD/EUR / CPI Food / CPI Energy / 鉄鋼石) の fetch スクリプト改修 + ライセンスリク監修 |
| **5/25** | GA 達成、Phase D 準備期間入り |
| **5/26-5/31** | catalog.json への 8-10 系列追加 PR + テスト + main 反映 |
| **6/1** | Phase D 第 1 期着手準備完了、6/2 (火) から平日毎日 Insight 投稿開始 |
| **6/2** | Insight #43 「米雇用統計 × USD/JPY × JGB 10y」公開 (新系列 US Nonfarm Payrolls 使用) |

---

## 4. リスクと代替案

| リスク | 確率 | 影響度 | 代替案 |
|---|---|---|---|
| ECB 政策金利ライセンス再配布制限が判明 | 低 | 中 | FRED の `ECBDFR` (ECB Deposit Facility Rate) を代替使用、public domain として再配布 |
| 中国 PMI ライセンス確認不能 | 中 | 中 | Insight #55 は鉄鋼石 + 石炭の 2 軸に再構成 |
| 木質燃料指数ソース未確定 | 高 | 低 | Insight #57 は Phase D 第 2 期 (7 月 ESG 軸) へ持ち越し、6 月は別の Insight (蓄電池等) で代替 |
| FRED API rate limit (120 req/min) | 低 | 低 | バッチ取得 + キャッシング、既存運用で実績あり |

---

## 5. リク (法務監修) 要確認事項

| # | 系列 | 確認内容 | 期限 |
|---|---|---|---|
| 1 | ECB 政策金利 / USD/EUR | ECB free use と CC BY 4.0 の互換性、出典表記の正確性 | 5/19 (火) |
| 2 | 中国 PMI | 国家統計局 (NBS) 利用規約、商用利用 + 再配布可否 | 5/22 (金) |
| 3 | 木質燃料指数 | FAO / USDA / 林野庁 の 3 ソース比較、ライセンス互換性 | Phase D 第 2 期着手前 (6/30) |

---

## 6. 自発訂正ログ (L-013)

なし (新規調査ドキュメント、訂正対象なし)。

---

*アオ (起草、Phase D 候補リスト連動) + リン (編集、2026-05-12 火曜、大規模告知準備 Day 1)*

🎯 **Phase D 第 1 期 22 本の Insight 候補のうち、優先度高 4 系列のソース・ライセンスを確定。5/26-5/31 で catalog 追加 PR を作成し、6/2 着手準備を完了させる。**
