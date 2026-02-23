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
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{outfit.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{outfit.vibe}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {outfit.season} · {outfit.situation}
          </p>
        </div>
        <button
          onClick={onFavorite}
          className="rounded-md border px-2 py-1 text-sm"
          aria-label="즐겨찾기"
          type="button"
        >
          {isFavorite ? '★ 저장됨' : '☆ 저장'}
        </button>
      </header>

      <ul className="space-y-3">
        {outfit.items.map((item, idx) => (
          <li key={`${item.name}-${idx}`} className="rounded-md bg-slate-100 p-3 text-sm dark:bg-slate-800">
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
              <a className="underline" href={createSearchUrl('naver', item.keywords)} target="_blank">네이버쇼핑</a>
              <a className="underline" href={createSearchUrl('coupang', item.keywords)} target="_blank">쿠팡</a>
              <a className="underline" href={createSearchUrl('musinsa', item.keywords)} target="_blank">무신사</a>
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
