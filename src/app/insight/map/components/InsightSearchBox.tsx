interface InsightSearchBoxProps {
  query: string;
}

export default function InsightSearchBox({ query }: InsightSearchBoxProps) {
  return (
    <form
      action="/insight/map"
      method="get"
      className="flex flex-wrap items-center gap-2 mb-6"
      role="search"
    >
      <label className="flex-1 min-w-[200px]">
        <span className="sr-only">Insight 検索</span>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="タイトル / lede / タグ / slug を検索 (例: lng, 太陽光, 9-region)"
          className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white text-ink placeholder:text-faint focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          autoComplete="off"
        />
      </label>
      <button
        type="submit"
        className="px-4 py-2 text-[12px] bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors"
      >
        検索
      </button>
      {query && (
        <a
          href="/insight/map"
          className="text-[12px] text-emerald-700 underline hover:text-emerald-800"
        >
          クリア
        </a>
      )}
    </form>
  );
}
