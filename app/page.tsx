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
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">학생 가성비 코디 추천 카드</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">현실 예산으로 예쁜 룩 3~5개 추천</p>
        <Link className="underline" href="/settings">API Key 설정하기</Link>
      </header>

      <RecommendationForm onSubmit={onSubmit} loading={loading} />
      {message && <p className="rounded bg-amber-100 p-2 text-sm text-amber-800">{message}</p>}

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
