/**
 * GET /download/all — 全 catalog 系列の CSV 一括 DL (ZIP 圧縮)
 *
 * Phase C Day 3 (2026-05-12) で実装。研究者・トレーディング会社が
 * 1 リクエストで全 105 系列の CSV + メタデータ + README + LICENSE を取得可能。
 *
 * ZIP 構成:
 *   eic-data-all.zip
 *     ├── README.md           (使い方 + ライセンス + 引用方法)
 *     ├── LICENSE.txt          (CC BY 4.0)
 *     ├── catalog.json         (全件メタデータ、D-011 schema)
 *     ├── manifest.csv         (id,name,domain,frequency,unit,source_name,source_url の一覧表)
 *     └── csv/
 *         ├── <id>.csv         (各 indicator の日次/月次 CSV、date + value)
 *         └── ... (取得成功した系列のみ、失敗系列は manifest に errors 記録)
 *
 * Cache: ISR 24 時間 (revalidate = 86400)、初回生成のみ重い (105 fetch 並列)
 */

import JSZip from "jszip";
import { fetchCatalog, type Indicator } from "@/lib/catalog";
import { idToDirectory } from "@/lib/series";

export const revalidate = 86400;
export const dynamic = "force-static";

const SERIES_BASE =
  "https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/processed";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildManifest(indicators: Indicator[]): string {
  const header = [
    "id",
    "name",
    "domain",
    "frequency",
    "unit",
    "source_name",
    "source_url",
    "license",
    "observation_cutoff",
  ].join(",");
  const rows = indicators.map((i) =>
    [
      i.id,
      i.name,
      i.domain,
      i.frequency,
      i.unit,
      i.source_name,
      i.source_url,
      i.license,
      i.observation_cutoff,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(","),
  );
  return [header, ...rows].join("\n");
}

function buildReadme(catalog: { indicator_count: number; generated_at: string; schema: string }): string {
  return `# EIC Data — All Series Bundle

毎朝 8:00 JST 自動更新の catalog メタデータ + 全 ${catalog.indicator_count} 系列の CSV (date, value) を 1 ZIP にまとめたバンドルです。

## 含まれるファイル

- \`catalog.json\` — D-011 schema 準拠の全件メタデータ (${catalog.indicator_count} 系列)
- \`manifest.csv\` — 系列一覧表 (id / name / domain / frequency / unit / source_name / source_url / license / observation_cutoff)
- \`csv/<id>.csv\` — 各系列の時系列 (date, value)、UTF-8、ヘッダ行 1 行
- \`LICENSE.txt\` — ライセンス情報 (CC BY 4.0)

## 使い方 (curl 例)

\`\`\`bash
# 1 リクエストで全 ${catalog.indicator_count} 系列をダウンロード
curl -L -o eic-data-all.zip https://data.eic-jp.org/download/all
unzip eic-data-all.zip -d eic-data
\`\`\`

## メタデータ

- generated_at: ${catalog.generated_at}
- schema: ${catalog.schema}
- 一次出典: 各系列の \`source_url\` を参照
- 引用形式: BibTeX / Chicago 17 / APA 7 の 3 形式を <https://data.eic-jp.org/catalog/<id>> で 1 クリックコピー可能

## ライセンス

CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) — 一般社団法人エネルギー情報センター
引用時は EIC Data + 各 indicator の \`source_name\` の併記推奨。

## 自動更新

毎平日朝 8:00 JST に eic-data-pipeline (GitHub Actions) で自動更新、ZIP は ISR 24 時間で再生成。
朝刊サマリーは <https://data.eic-jp.org/today> で 5 系列横断の解説付きで公開中。
`;
}

const LICENSE_TXT = `EIC Data — Energy Information Center Data Platform
Copyright (c) 2026 一般社団法人エネルギー情報センター

This work is licensed under a Creative Commons Attribution 4.0 International License.
To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/

You are free to:
  - Share: copy and redistribute the material in any medium or format
  - Adapt: remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
  - Attribution: You must give appropriate credit, provide a link to the license,
    and indicate if changes were made.

Suggested citation:
  EIC Data (一般社団法人エネルギー情報センター). 2026. "EIC Data Indicator Bundle."
  Accessed YYYY-MM-DD. https://data.eic-jp.org/

Each indicator's primary source license is noted in catalog.json (\`license\` field).
Always cite the original primary source in addition to EIC Data.
`;

async function fetchCsvOrNull(id: string): Promise<string | null> {
  try {
    const dir = idToDirectory(id);
    const url = `${SERIES_BASE}/${dir}/${id}.csv`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function GET() {
  const catalog = await fetchCatalog();
  const zip = new JSZip();

  zip.file("README.md", buildReadme(catalog));
  zip.file("LICENSE.txt", LICENSE_TXT);
  zip.file("catalog.json", JSON.stringify(catalog, null, 2));
  zip.file("manifest.csv", buildManifest(catalog.indicators));

  const csvFolder = zip.folder("csv")!;
  const errors: { id: string; reason: string }[] = [];

  // 並列フェッチ (105 並列でも raw.githubusercontent.com のレート制限内)
  const fetchTasks = catalog.indicators.map(async (ind) => {
    const csv = await fetchCsvOrNull(ind.id);
    if (csv === null) {
      errors.push({ id: ind.id, reason: "fetch failed or not yet available" });
      return;
    }
    csvFolder.file(`${ind.id}.csv`, csv);
  });
  await Promise.all(fetchTasks);

  if (errors.length > 0) {
    zip.file(
      "errors.json",
      JSON.stringify(
        { generated_at: new Date().toISOString(), errors },
        null,
        2,
      ),
    );
  }

  const buffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="eic-data-all-${catalog.generated_at.slice(0, 10)}.zip"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
