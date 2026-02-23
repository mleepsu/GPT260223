'use client';

import { createSearchUrl } from '@/lib/searchLinks';
import { OutfitsResponse } from '@/lib/schema';

type Props = {
  outfit: OutfitsResponse['outfits'][number];
  onFavorite: () => void;
  isFavorite: boolean;
};

export default function OutfitCard({ outfit, onFavorite, isFavorite }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/50 bg-white/90 p-4 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-black/30">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{outfit.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{outfit.vibe}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {outfit.season} · {outfit.situation}
          </p>
        </div>
        <button
          onClick={onFavorite}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          aria-label="즐겨찾기"
          type="button"
        >
          {isFavorite ? '★ 저장됨' : '☆ 저장'}
        </button>
      </header>

      <ul className="space-y-3">
        {outfit.items.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/80"
          >
            <p className="font-medium">[{item.category}] {item.name}</p>
            <p className="text-xs">키워드: {item.keywords.join(', ')}</p>
            <p className="text-xs">
              가격: {item.priceKRWMin.toLocaleString()}~{item.priceKRWMax.toLocaleString()}원
            </p>
            <p className="text-xs">이유: {item.why}</p>
            {item.alternatives.length > 0 && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                저가 대체: {item.alternatives.map((alt) => alt.name).join(', ')}
              </p>
            )}
            <div className="mt-2 flex gap-2 text-xs">
              <a className="rounded-full bg-white px-2 py-1 underline dark:bg-slate-900" href={createSearchUrl('naver', item.keywords)} target="_blank" rel="noreferrer noopener">네이버쇼핑</a>
              <a className="rounded-full bg-white px-2 py-1 underline dark:bg-slate-900" href={createSearchUrl('coupang', item.keywords)} target="_blank" rel="noreferrer noopener">쿠팡</a>
              <a className="rounded-full bg-white px-2 py-1 underline dark:bg-slate-900" href={createSearchUrl('musinsa', item.keywords)} target="_blank" rel="noreferrer noopener">무신사</a>
            </div>
          </li>
        ))}
      </ul>

      <footer className="mt-3">
        <p className="font-semibold text-rose-600 dark:text-rose-300">
          예상 합계: {outfit.totalPriceKRWMin.toLocaleString()}~{outfit.totalPriceKRWMax.toLocaleString()}원
        </p>
        <ul className="list-disc pl-5 text-sm">
          {outfit.tips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </footer>
    </article>
  );
}
