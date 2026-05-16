# Newsletter Domain 検証手順 (Resend + ムームー DNS)

Day 5 夜 (2026-05-16) で `data.eic-jp.org` を Resend で検証し、Newsletter を `onboarding@resend.dev` から自社 Domain (`newsletter@data.eic-jp.org`) に切替。

---

## 1. Resend ダッシュボード Domain 追加

1. <https://resend.com/domains> → "Add Domain"
2. Domain: `data.eic-jp.org` (subdomain 推奨、ルート `eic-jp.org` には影響なし)
3. Region: US East (デフォルト) または EU West (GDPR 配慮なら)
4. → 表示される 4 つの DNS レコードをコピー

## 2. ムームー DNS にレコード追加 (5/16 19:05 完了済)

ムームー DNS カスタム設定 (ホスト名は `data` 前置 = `*.data.eic-jp.org`):

| 種別 | ホスト名 | 内容 |
|---|---|---|
| TXT | `resend._domainkey.data` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ…` (DKIM 公開鍵) |
| MX | `send.data` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |
| TXT | `send.data` | `v=spf1 include:amazonses.com ~all` (SPF) |
| TXT | `_dmarc.data` | `v=DMARC1; p=none;` (DMARC 緩めの初期設定) |

DNS 反映待機: 5-15 分 (TTL 短縮設定があれば 1-2 分)

## 3. Resend ダッシュボードで Verify 押下

- "Verify DNS Records" をクリック → 4 レコードすべて `✓` を確認
- 失敗時:
  - DKIM: `resend._domainkey` のスペル / `data` 前置忘れ
  - SPF: 既存 SPF レコードがあれば `include:amazonses.com` を追記 (1 ドメイン 1 SPF 制約)
  - DMARC: `_dmarc.data` 前置忘れ

## 4. Vercel 環境変数設定

Vercel Project Settings > Environment Variables (Production スコープ):

```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=newsletter@data.eic-jp.org
RESEND_FROM_NAME=EIC Data
NEWSLETTER_SECRET=<16 文字以上のランダム文字列>
NEWSLETTER_BASE_URL=https://data.eic-jp.org
```

設定後は Redeploy 必須 (Vercel は env 変更時に自動 redeploy しない場合あり)。

## 5. 自分宛 smoke test

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"YOUR_PERSONAL@gmail.com"}' \
  https://data.eic-jp.org/api/newsletter
```

期待レスポンス:
```json
{
  "ok": true,
  "data": {"email":"...", "utm":{}, "subscribedAt":"..."},
  "emailSent": true,
  "confirmRequired": true
}
```

→ メール受信箱を確認 → 件名「[EIC Data] ニュースレター購読確認」のメールが届けば成功。

→ メール内「購読を確定する」ボタンをクリック → `/newsletter/confirm?status=ok&email=...` 表示 + Resend Audience に Contact が追加されていることを <https://resend.com/audiences> で確認。

→ メール末尾「こちらから解除」リンクをクリック → `/newsletter/unsubscribe?status=ok&email=...` 表示 + Resend Audience から Contact が削除されていることを確認。

## 6. トラブル対応

### Resend HTTP 403
- Domain 未検証: ステップ 3 をやり直し
- API キー権限不足: <https://resend.com/api-keys> で full access に再発行
- Free tier 制約: 月 3,000 通超過 (現状は問題なし、想定 100 通/月)

### DKIM 検証失敗
- ムームー DNS で `data` 前置を忘れている可能性 (`resend._domainkey` だけだと `eic-jp.org` 直下扱い)
- TTL 反映待ち (最大 24h、通常 5-15 分)
- `dig TXT resend._domainkey.data.eic-jp.org +short` で確認

### 確認メールが届かない
- 迷惑メールフォルダ確認 (DKIM + SPF + DMARC 揃っていれば通常は inbox)
- Vercel Functions logs で `[newsletter] confirm email send failed` を grep (route.ts で warning log 出力)
- Resend ダッシュボード <https://resend.com/emails> で実際の送信ログ確認

### 確認リンクをクリックしても scaffold モード表示
- `RESEND_API_KEY` が **Vercel Production** スコープに設定されているか確認 (Preview/Development のみだと本番では空)
- Vercel で env 設定後 Redeploy したか確認

---

*作成: Day 5 夜 (2026-05-16)、リン + ユウ + タク + EDA*
*関連: `src/lib/newsletter.ts` (resolveFromHeader)、`src/app/api/newsletter/route.ts` (warning log)*
