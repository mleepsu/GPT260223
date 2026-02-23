'use client';

import { RecommendationInput } from '@/lib/schema';
import { FormEvent, useState } from 'react';

type Props = {
  onSubmit: (input: RecommendationInput) => Promise<void>;
  loading: boolean;
};

const initialState: RecommendationInput = {
  gender: '',
  grade: '',
  heightBody: '',
  style: '캐주얼',
  situation: '등교',
  season: '봄',
  preferredColors: '',
  budgetKRWMax: 100000,
  uniformLayering: false,
  ownedItems: '',
};

export default function RecommendationForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<RecommendationInput>(initialState);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/50 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-black/20">
      <h2 className="text-lg font-semibold">코디 조건 입력</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ['gender', '성별(선택)'],
          ['grade', '학년(선택)'],
          ['heightBody', '키/체형(선택)'],
          ['style', '스타일'],
          ['situation', '상황'],
          ['season', '계절'],
          ['preferredColors', '색 선호'],
          ['ownedItems', '내 옷장(선택)'],
        ].map(([field, label]) => (
          <label className="text-sm" key={field}>
            {label}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-slate-700"
              value={String(form[field as keyof RecommendationInput] ?? '')}
              onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <label className="text-sm">
        예산 상한(KRW)
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-slate-700"
          value={form.budgetKRWMax}
          onChange={(e) => setForm((prev) => ({ ...prev, budgetKRWMax: Number(e.target.value) || 0 }))}
          min={10000}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.uniformLayering}
          onChange={(e) => setForm((prev) => ({ ...prev, uniformLayering: e.target.checked }))}
        />
        교복 위 코디 포함
      </label>
      <button className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow-md shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-slate-950" disabled={loading} type="submit">
        {loading ? '생성 중...' : '코디 추천 생성'}
      </button>
    </form>
  );
}
