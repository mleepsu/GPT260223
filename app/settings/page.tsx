'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getApiKey, getSaveKeyToggle, maskKey, setApiKey, setSaveKeyToggle } from '@/lib/storage';

export default function SettingsPage() {
  const [apiKey, setKey] = useState('');
  const [saveEnabled, setSaveEnabled] = useState(true);

  useEffect(() => {
    setKey(getApiKey());
    setSaveEnabled(getSaveKeyToggle());
  }, []);

  const onSave = () => {
    setSaveKeyToggle(saveEnabled);
    setApiKey(apiKey);
    alert('저장되었습니다.');
  };

  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="mb-4 text-2xl font-bold">설정</h1>
      <label className="mb-3 block text-sm">
        Gemini API Key
        <input
          className="mt-1 w-full rounded border p-2"
          value={apiKey}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          aria-label="Gemini API Key"
        />
      </label>
      <p className="mb-3 text-xs">현재 키: {apiKey ? maskKey(apiKey) : '없음'}</p>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={saveEnabled}
          onChange={(e) => setSaveEnabled(e.target.checked)}
        />
        이 브라우저에 저장 (기본 ON)
      </label>
      <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={onSave} type="button">저장</button>
      <Link href="/" className="ml-3 underline">홈으로</Link>
    </main>
  );
}
