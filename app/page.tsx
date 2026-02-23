'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import OutfitCard from '@/components/OutfitCard';
import RecommendationForm from '@/components/RecommendationForm';
import { RecommendationInput, OutfitsResponse } from '@/lib/schema';
import { getApiKey, getFavorites, setFavorites } from '@/lib/storage';

const CACHE_VERSION = 'v2';
const cacheKeyFromInput = (input: RecommendationInput): string =>
  `outfit_cache:${CACHE_VERSION}:${JSON.stringify(input)}`;

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [outfits, setOutfits] = useState<OutfitsResponse['outfits']>([]);
  const [favorites, setFavs] = useState<OutfitsResponse['outfits']>([]);

  useEffect(() => {
    setFavs(getFavorites());
  }, []);

  const favoriteTitles = useMemo(() => new Set(favorites.map((f) => f.title)), [favorites]);

  const onSubmit = async (input: RecommendationInput) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setMessage('먼저 설정 페이지에서 API Key를 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const cacheKey = cacheKeyFromInput(input);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const hasPreviewImages = Array.isArray(parsed?.outfits)
          && parsed.outfits.every((outfit: any) => typeof outfit?.previewImageUrl === 'string' && outfit.previewImageUrl.length > 0);

        if (hasPreviewImages) {
          setOutfits(parsed.outfits);
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/generate-outfits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-gemini-key': apiKey,
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? '추천 생성에 실패했어요.');
        setLoading(false);
        return;
      }

      setOutfits(data.outfits);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error(error);
      setMessage('요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (title: string) => {
    const target = outfits.find((o) => o.title === title);
    if (!target) return;
    const exists = favorites.some((f) => f.title === title);
    const next = exists ? favorites.filter((f) => f.title !== title) : [...favorites, target];
    setFavs(next);
    setFavorites(next);
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="rounded-2xl border border-white/40 bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-xl shadow-slate-400/30">
        <h1 className="text-3xl font-bold tracking-tight">학생 가성비 코디 추천 카드</h1>
        <p className="mt-2 text-sm text-slate-100/90">입력한 조건으로 맞춤 코디를 깔끔하게 추천해드려요.</p>
        <Link className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm underline underline-offset-2" href="/settings">API Key 설정하기</Link>
      </header>

      <RecommendationForm onSubmit={onSubmit} loading={loading} />
      {message && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      <section className="space-y-3" aria-live="polite">
        {outfits.map((outfit) => (
          <OutfitCard
            key={outfit.title}
            outfit={outfit}
            isFavorite={favoriteTitles.has(outfit.title)}
            onFavorite={() => toggleFavorite(outfit.title)}
          />
        ))}
      </section>
    </main>
  );
}
