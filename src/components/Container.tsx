import type { ReactNode } from "react";

export type ContainerSize = "wide" | "data";

const SIZE_CLASSES: Record<ContainerSize, string> = {
  // 俯瞰系: ハブ / 一覧 / ダッシュボード / 長文ページ
  // (TOP / Insight 一覧 / catalog 一覧 / Insight マップ / データ品質 / ドメイン詳細 /
  //  検索 / 用語集 / today / markets / 方法論・規約など長文ページの外枠)
  wide: "max-w-3xl md:max-w-5xl lg:max-w-7xl xl:max-w-[1320px]",
  // 詳細 + 解説併記 (Insight 個別 / catalog 個別) — 既存デフォルト、後方互換
  data: "max-w-3xl md:max-w-5xl lg:max-w-6xl",
};

export default function Container({
  children,
  className = "",
  size = "data",
}: {
  children: ReactNode;
  className?: string;
  size?: ContainerSize;
}) {
  return (
    <div className={`mx-auto px-4 ${SIZE_CLASSES[size]} ${className}`.trim()}>
      {children}
    </div>
  );
}
