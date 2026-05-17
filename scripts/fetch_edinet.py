#!/usr/bin/env python3
"""
N10 EDINET 自動取得スキャフォルディング (Day 6 PM, 2026-05-17)

EDINET (金融庁 電子開示システム) から有価証券報告書 / 四半期報告書を取得し、
JSON / CSV に正規化して eic-data-pipeline へ流す前段の構造を確立する。

本ファイルは "scaffolding" 段階 (Phase C Day 6) で、実装は Phase D 第 1 期
(5/20 以降) に着地予定:
  - authenticate()      : Subscription-Key 検証 + 期限確認
  - fetch_disclosures() : /v2/documents.json + /v2/documents/{docID} 経由で
                          書類一覧と本体 (XBRL zip) を取得
  - parse_disclosure()  : XBRL → 数値 + テキスト辞書化
  - write_metadata()    : data/raw/edinet/<docID>/metadata.json を書き出し

main() は scaffolding 段階では "なにもしないで exit 0" を返す。CI smoke test
(`python scripts/fetch_edinet.py --dry-run`) はこの exit 0 だけを担保する。

Reference:
  - EDINET API v2: https://disclosure2.edinet-fsa.go.jp/
  - EDINET API 利用規約: 取得頻度は 5 req/sec 以下 (license: edinet-terms)
  - docs/source_map.yaml の edinet: セクションが本 script の参照元

設計ノート:
  - 認証は env var EDINET_SUBSCRIPTION_KEY (Phase D で Vercel Project Settings)
  - 出力先は eic-data-pipeline 側の data/raw/edinet/ (本 web repo では生成しない)
  - freshness_sla_days: 7 (EDINET 開示後 1 週間以内に取得が望ましい)
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

LOGGER = logging.getLogger("fetch_edinet")
LOGGER.setLevel(logging.INFO)
if not LOGGER.handlers:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s"))
    LOGGER.addHandler(handler)

EDINET_API_BASE = "https://disclosure.edinet-fsa.go.jp/api/v2"
DEFAULT_RATE_LIMIT_RPS = 5
DEFAULT_SLA_DAYS = 7


@dataclass(frozen=True)
class EdinetCredentials:
    """EDINET API v2 認証情報。"""

    subscription_key: str
    expires_at: date | None = None

    def is_expired(self, now: date | None = None) -> bool:
        if self.expires_at is None:
            return False
        return (now or date.today()) > self.expires_at


@dataclass(frozen=True)
class Disclosure:
    """1 件の開示書類メタ。"""

    doc_id: str
    edinet_code: str
    filer_name: str
    doc_type_code: str
    submit_datetime: datetime
    period_end: date | None
    has_xbrl: bool


def authenticate(env: dict[str, str] | None = None) -> EdinetCredentials:
    """env からサブスクリプションキーを読み取り EdinetCredentials を返す。

    Phase D 実装時:
      - EDINET_SUBSCRIPTION_KEY が無ければ FileNotFoundError 相当を投げる
      - EDINET_SUBSCRIPTION_KEY_EXPIRES_AT (ISO date) があれば expires_at に格納
      - is_expired() が True の場合は呼び出し側で早期失敗

    本 scaffolding では NotImplementedError を投げる。CI smoke test は
    main() の --dry-run 経路で本関数を呼ばないので影響なし。
    """
    raise NotImplementedError(
        "authenticate() will be implemented in Phase D Q1 (>= 2026-05-20). "
        "Use --dry-run for scaffolding-stage smoke test."
    )


def fetch_disclosures(
    creds: EdinetCredentials,
    target_date: date,
    *,
    rate_limit_rps: int = DEFAULT_RATE_LIMIT_RPS,
) -> list[Disclosure]:
    """指定日の開示書類一覧を /v2/documents.json から取得。

    Phase D 実装時:
      - urllib.request か requests を使い ?date=YYYY-MM-DD&type=2 で叩く
      - レスポンス JSON の results[] から Disclosure dataclass にマップ
      - rate_limit_rps を超えないように time.sleep(1 / rps) を入れる
      - HTTP エラーは 3 回までリトライ、それでも失敗なら呼び出し側へ raise

    Args:
        creds: authenticate() の戻り値。
        target_date: 取得対象日 (UTC でなく JST)。
        rate_limit_rps: 1 秒あたりリクエスト数の上限 (EDINET 規約は 5)。
    """
    raise NotImplementedError(
        "fetch_disclosures() will be implemented in Phase D Q1. "
        f"Planned: GET {EDINET_API_BASE}/documents.json?date={{target_date}}&type=2 "
        f"with creds.subscription_key, capped at {rate_limit_rps} rps."
    )


def parse_disclosure(xbrl_zip: bytes) -> dict[str, Any]:
    """XBRL zip を辞書に展開。

    Phase D 実装時:
      - zipfile.ZipFile でメモリ展開 → .xbrl / .xsd を抜き出し
      - arelle or python-xbrl で taxonomies を解釈
      - {context: {tag: value}} 形式の辞書化
      - 文字エンコードは EDINET 既定の UTF-8

    Args:
        xbrl_zip: fetch_disclosures() で得た書類本体 zip のバイト列。

    Returns:
        {"facts": {...}, "schema_ref": "...", "filed_date": "..."} 形式の辞書。
    """
    raise NotImplementedError(
        "parse_disclosure() will be implemented in Phase D Q1. "
        "Expected to leverage arelle for XBRL taxonomy resolution."
    )


def write_metadata(
    out_dir: Path,
    disclosure: Disclosure,
    facts: dict[str, Any],
    *,
    license_id: str = "edinet-terms",
    freshness_sla_days: int = DEFAULT_SLA_DAYS,
) -> Path:
    """正規化済みメタデータを <out_dir>/<doc_id>/metadata.json に書き出す。

    Phase D 実装時:
      - out_dir.joinpath(disclosure.doc_id) を mkdir(parents=True, exist_ok=True)
      - metadata.json のスキーマは eic-data-pipeline の data/raw/_schema.json と整合
      - license / freshness_sla_days は docs/source_map.yaml の edinet: と同期
      - 戻り値: 書き出した metadata.json への絶対 Path
    """
    raise NotImplementedError(
        "write_metadata() will be implemented in Phase D Q1. "
        f"Planned output: {out_dir}/<doc_id>/metadata.json with "
        f"license={license_id}, freshness_sla_days={freshness_sla_days}."
    )


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="fetch_edinet",
        description=(
            "EDINET 自動取得スキャフォルディング (Phase C Day 6, 2026-05-17)。"
            " 実 fetch は Phase D 第 1 期で実装。"
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="scaffolding smoke test 用。何もせず exit 0。",
    )
    parser.add_argument(
        "--date",
        type=lambda s: datetime.strptime(s, "%Y-%m-%d").date(),
        default=date.today(),
        help="取得対象日 (YYYY-MM-DD)。Phase D で fetch_disclosures に渡される。",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("data/raw/edinet"),
        help="metadata.json の出力先 (eic-data-pipeline 側の data/raw/edinet)。",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """scaffolding 段階では何もせず exit 0。

    Phase D 実装後の流れ:
      1. authenticate()
      2. fetch_disclosures(creds, args.date)
      3. for d in disclosures: parse_disclosure(...) → write_metadata(...)
      4. 集計サマリを log.info で出して exit 0、失敗時は exit 1

    本日 (2026-05-17) は --dry-run 経路でだけ呼ばれる想定。
    通常実行は実装未完で NotImplementedError なので注意。
    """
    args = _parse_args(sys.argv[1:] if argv is None else argv)

    if args.dry_run:
        LOGGER.info(
            "scaffolding smoke test ok: date=%s out_dir=%s api_base=%s",
            args.date.isoformat(),
            args.out_dir,
            EDINET_API_BASE,
        )
        return 0

    LOGGER.warning(
        "fetch_edinet is in scaffolding stage; real fetch lands in Phase D Q1. "
        "Run with --dry-run to validate the entry point."
    )
    creds = authenticate(os.environ.copy())  # noqa: F841 — 設計確認のため呼び出しを残す
    return 0


if __name__ == "__main__":
    sys.exit(main())
