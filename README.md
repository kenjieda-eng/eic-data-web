# EIC Data — 日本のエネルギーと金融の引用インフラ

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

一般社団法人エネルギー情報センターが運営する、エネルギー・金融・マクロ経済の引用可能データ基盤の公開フロントエンド（Next.js + Vercel）。

データパイプラインは [`kenjieda-eng/eic-data-pipeline`](https://github.com/kenjieda-eng/eic-data-pipeline) で運用、本リポジトリは catalog（D-011 メタデータ・スキーマ）を介してデータを参照する。

## 開発

```bash
pnpm install
pnpm dev    # http://localhost:3000
pnpm build  # 本番ビルド
```

## 技術スタック

- Next.js 16 (App Router, Turbopack)
- TypeScript / Tailwind CSS v4
- ECharts / MDX
- Vercel デプロイ（`kenjieda-engs-projects` scope）

## ライセンス

本リポジトリのソースコード・コンテンツは **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** で公開する（D-013 / D-014 ADR に準拠）。
