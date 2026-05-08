import type { CatalogFilters } from "../filters";

interface SearchBoxProps {
  filters: CatalogFilters;
}

export default function SearchBox({ filters }: SearchBoxProps) {
  return (
    <form
      action="/catalog"
      method="get"
      className="flex flex-wrap items-center gap-2 mb-4"
      role="search"
    >
      {filters.domain && (
        <input type="hidden" name="domain" value={filters.domain} />
      )}
      {filters.frequency && (
        <input type="hidden" name="frequency" value={filters.frequency} />
      )}
      <label className="flex-1 min-w-[200px]">
        <span className="sr-only">検索</span>
        <input
          type="search"
          name="q"
          defaultValue={filters.query}
          placeholder="id または名称で検索 (例: jepx, 石炭, fuel-coal)"
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
      {filters.query && (
        <a
          href={`/catalog${
            filters.domain || filters.frequency
              ? `?${new URLSearchParams({
                  ...(filters.domain ? { domain: filters.domain } : {}),
                  ...(filters.frequency ? { frequency: filters.frequency } : {}),
                }).toString()}`
              : ""
          }`}
          className="text-[12px] text-emerald-700 underline hover:text-emerald-800"
        >
          クリア
        </a>
      )}
    </form>
  );
}
