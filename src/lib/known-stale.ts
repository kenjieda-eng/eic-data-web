// 更新が止まっている系列に「なぜ止まっているか」を添えるための定義。
// pipeline 側 eic-data-pipeline/scripts/check_staleness.py の KNOWN_STALE と対。
// あちらは「更新が来ないのが正常」な系列を staleness gate から除外する。
// web 側は同じ 6 系列について、黙って古いデータを見せるのではなく、理由付きで
// 誠実に表示する（「止まったデータを黙って見せない」）。
//
// ★ 対象 6 系列と種別の正は必ず check_staleness.py の KNOWN_STALE に一致させること。
//   2026-07-18 に pipeline 側で 6 系列を登録。系列が復活・更新再開したら両方から外す。

export type KnownStaleKind = "structural" | "seasonal";

export interface KnownStale {
  // structural: 構造的にもう更新されない（Brexit で EU ETS 離脱・データ廃止など）
  // seasonal:   季節・気候要因で長期間値が動かないことがある（降雪が稀な地点の最深積雪等）
  kind: KnownStaleKind;
  note: string;
}

// pipeline: "UK left EU ETS post-Brexit; data ends 2020"
const NOTE_UK =
  "英国は Brexit に伴い EU ETS を離脱したため、この系列は 2020 年を最後に更新されません（構造的な更新停止）。過去データは引き続き参照・引用できます。";
// pipeline: "Liechtenstein has no recent verified-emissions data"
const NOTE_LI =
  "リヒテンシュタインの当該データは近年公表がなく、更新停止中です。過去データは引き続き参照できます。";
// pipeline: "seasonal: no snowfall ...; absence is expected"
const NOTE_SNOW =
  "この地域では積雪の観測が数年間ないため、値が長期間更新されないことがあります（季節・気候要因であり、取得の不具合ではありません）。";

// 系列 id → 更新停止の種別・理由文。check_staleness.py の KNOWN_STALE と 1:1。
export const KNOWN_STALE: Record<string, KnownStale> = {
  // EU ETS 英国: Brexit で EU ETS を離脱、検証排出データは 2020 年で終端（構造的死系列）
  "eu-ets-emissions-country-gb": { kind: "structural", note: NOTE_UK },
  "eu-ets-allowances-allocated-country-gb": { kind: "structural", note: NOTE_UK },
  // EU ETS リヒテンシュタイン: 近年の検証排出データが存在しない（構造的死系列）
  "eu-ets-emissions-country-li": { kind: "structural", note: NOTE_LI },
  "eu-ets-allowances-allocated-country-li": { kind: "structural", note: NOTE_LI },
  // JMA 最深積雪: 積雪が稀な地点。降雪イベントが無い＝値が更新されないのが正常
  "jma-snow-max-kansai": { kind: "seasonal", note: NOTE_SNOW },
  "jma-snow-max-shikoku": { kind: "seasonal", note: NOTE_SNOW },
};

// 系列 id が既知の更新停止系列なら注記を、そうでなければ null を返す。
export function getKnownStale(id: string): KnownStale | null {
  return KNOWN_STALE[id] ?? null;
}
