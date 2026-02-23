import { describe, expect, it } from 'vitest';
import { parseOutfitsResponse } from '@/lib/gemini';

const valid = {
  outfits: Array.from({ length: 3 }).map((_, i) => ({
    title: `룩${i}`,
    vibe: '캐주얼',
    season: '봄',
    situation: '등교',
    items: [
      {
        category: 'TOP',
        name: '맨투맨',
        keywords: ['맨투맨', '무지'],
        priceKRWMin: 10000,
        priceKRWMax: 20000,
        why: '활용도 높음',
        alternatives: [],
      },
    ],
    totalPriceKRWMin: 10000,
    totalPriceKRWMax: 20000,
    tips: ['톤온톤'],
  })),
};

describe('parseOutfitsResponse', () => {
  it('parses markdown wrapped json', () => {
    const raw = `\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``;
    const parsed = parseOutfitsResponse(raw);
    expect(parsed.outfits).toHaveLength(3);
  });
});
