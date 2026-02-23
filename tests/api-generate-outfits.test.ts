import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/gemini', () => ({
  maskApiKey: (key: string) => `${key.slice(0, 2)}***`,
  requestGeminiOutfits: vi.fn(),
}));

import { POST } from '@/app/api/generate-outfits/route';
import { requestGeminiOutfits } from '@/lib/gemini';

const body = {
  style: '캐주얼',
  situation: '등교',
  season: '봄',
  budgetKRWMax: 100000,
};

describe('POST /api/generate-outfits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when key is missing', async () => {
    const req = new Request('http://localhost/api/generate-outfits', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('returns 200 when request succeeds', async () => {
    vi.mocked(requestGeminiOutfits).mockResolvedValue({
      outfits: [
        {
          title: '룩1',
          vibe: '캐주얼',
          season: '봄',
          situation: '등교',
          items: [
            {
              category: 'TOP',
              name: '맨투맨',
              keywords: ['맨투맨'],
              priceKRWMin: 10000,
              priceKRWMax: 20000,
              why: '무난',
              alternatives: [],
            },
          ],
          totalPriceKRWMin: 10000,
          totalPriceKRWMax: 20000,
          tips: ['레이어링'],
        },
        {
          title: '룩2',
          vibe: '캐주얼',
          season: '봄',
          situation: '등교',
          items: [
            {
              category: 'BOTTOM',
              name: '데님',
              keywords: ['데님'],
              priceKRWMin: 20000,
              priceKRWMax: 30000,
              why: '활용도',
              alternatives: [],
            },
          ],
          totalPriceKRWMin: 20000,
          totalPriceKRWMax: 30000,
          tips: ['핏'],
        },
        {
          title: '룩3',
          vibe: '캐주얼',
          season: '봄',
          situation: '등교',
          items: [
            {
              category: 'SHOES',
              name: '스니커즈',
              keywords: ['스니커즈'],
              priceKRWMin: 30000,
              priceKRWMax: 40000,
              why: '편함',
              alternatives: [],
            },
          ],
          totalPriceKRWMin: 30000,
          totalPriceKRWMax: 40000,
          tips: ['양말 톤'],
        },
      ],
    } as any);

    const req = new Request('http://localhost/api/generate-outfits', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', 'x-user-gemini-key': 'test-key' },
    });
    const res = await POST(req as any);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.outfits[0].previewImageUrl).toContain('image.pollinations.ai');
  });
});
