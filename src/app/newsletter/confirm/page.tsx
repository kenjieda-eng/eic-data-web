import Link from "next/link";
import Container from "@/components/Container";

export const metadata = {
  title: "ニュースレター購読確認 | EIC Data",
  description:
    "EIC Data 週次ニュースレターの購読確認結果。Double opt-in 完了後の表示ページ。",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    email?: string;
    reason?: string;
  }>;
}

const STATUS_MESSAGES: Record<
  string,
  { tone: "success" | "warning" | "error"; title: string; body: string }
> = {
  ok: {
    tone: "success",
    title: "✓ 購読を確定しました",
    body: "EIC Data 週次ニュースレターへの購読が完了しました。毎週土曜朝 8:00 JST に最新の Insight + JEPX 特異日 + 用語集新項目をお届けします。",
  },
  scaffold: {
    tone: "warning",
    title: "⚠️ scaffold モード",
    body: "本番 RESEND_API_KEY が未設定のため、Token 検証は通りましたが Resend Audience への登録は行われていません。EDA さん環境変数設定後に再度クリックしてください。",
  },
  invalid: {
    tone: "error",
    title: "✗ 確認リンクが無効です",
    body: "リンクの有効期限 (7 日間) が切れているか、改ざんされています。もう一度購読フォームから登録してください。",
  },
  error: {
    tone: "error",
    title: "✗ 登録時にエラーが発生しました",
    body: "Resend API への接続でエラーが発生しました。お手数ですが時間をおいて再度購読フォームからお試しください。",
  },
};

export default async function NewsletterConfirmPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = sp.status ?? "ok";
  const message = STATUS_MESSAGES[status] ?? STATUS_MESSAGES.ok;
  const email = sp.email;

  const toneClass =
    message.tone === "success"
      ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
      : message.tone === "warning"
      ? "border-amber-200 bg-amber-50/40 text-amber-900"
      : "border-rose-200 bg-rose-50/40 text-rose-900";

  return (
    <Container size="wide" className="py-16">
      <div className={`mx-auto max-w-2xl rounded-md border ${toneClass} p-6`}>
        <h1 className="text-2xl font-bold">{message.title}</h1>
        {email && (
          <p className="mt-2 text-sm">
            対象: <code className="font-mono">{email}</code>
          </p>
        )}
        <p className="mt-4 text-sm md:text-base leading-relaxed">{message.body}</p>
        {sp.reason && (
          <p className="mt-3 text-xs text-faint">
            詳細: <code>{sp.reason}</code>
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/"
            className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-emerald-800 hover:bg-emerald-50"
          >
            トップへ戻る
          </Link>
          <Link
            href="/insight"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-ink hover:bg-slate-50"
          >
            Insight 一覧を見る
          </Link>
        </div>
      </div>
    </Container>
  );
}
