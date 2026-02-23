import { OutfitsResponse, RecommendationInput, outfitsResponseSchema } from '@/lib/schema';

const MODEL_NAMES = ['gemini-3-flash-preview', 'gemini-2.0-flash'];

const responseSchema = {
  type: 'object',
  properties: {
    outfits: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          vibe: { type: 'string' },
          season: { type: 'string' },
          situation: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: ['TOP', 'BOTTOM', 'OUTER', 'SHOES', 'BAG', 'ACCESSORY'] },
                name: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
                priceKRWMin: { type: 'number' },
                priceKRWMax: { type: 'number' },
                why: { type: 'string' },
                alternatives: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      keywords: { type: 'array', items: { type: 'string' } },
                      priceKRWMin: { type: 'number' },
                      priceKRWMax: { type: 'number' },
                    },
                    required: ['name', 'keywords', 'priceKRWMin', 'priceKRWMax'],
                  },
                },
              },
              required: ['category', 'name', 'keywords', 'priceKRWMin', 'priceKRWMax', 'why', 'alternatives'],
            },
          },
          totalPriceKRWMin: { type: 'number' },
          totalPriceKRWMax: { type: 'number' },
          tips: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'vibe', 'season', 'situation', 'items', 'totalPriceKRWMin', 'totalPriceKRWMax', 'tips'],
      },
    },
  },
  required: ['outfits'],
};

const systemPrompt = `너는 한국 중고등학생을 위한 가성비 코디 추천 도우미다.
규칙:
- 현실적인 저가 위주 추천
- 노출/성인 컨셉 금지, 체형 비하/다이어트 강요 금지, 과소비 조장 금지
- 예산 상한을 넘지 않도록 구성. 넘을 수 있으면 alternatives에 저가 대체안 필수
- 국내에서 흔히 구매 가능한 카테고리/키워드 사용
- 반드시 JSON만 반환, 설명 문장 금지`; 

const buildUserPrompt = (input: RecommendationInput): string => {
  return JSON.stringify({
    task: '학생 코디 카드 3~5개 추천',
    constraints: {
      budgetKRWMax: input.budgetKRWMax,
      style: input.style,
      situation: input.situation,
      season: input.season,
      gender: input.gender,
      grade: input.grade,
      heightBody: input.heightBody,
      preferredColors: input.preferredColors,
      uniformLayering: input.uniformLayering,
      ownedItems: input.ownedItems,
    },
  });
};

export const maskApiKey = (key: string): string => {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export const parseOutfitsResponse = (raw: string): OutfitsResponse => {
  const repaired = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(repaired);
  return outfitsResponseSchema.parse(parsed);
};

const extractText = (data: any): string => {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    throw new Error('Gemini 응답 형식이 올바르지 않습니다.');
  }
  const textPart = parts.find((p) => typeof p?.text === 'string');
  if (!textPart?.text) {
    throw new Error('Gemini 응답에서 텍스트를 찾을 수 없습니다.');
  }
  return textPart.text;
};

export const requestGeminiOutfits = async (
  apiKey: string,
  input: RecommendationInput,
): Promise<OutfitsResponse> => {
  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [{ parts: [{ text: buildUserPrompt(input) }] }],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: 'application/json',
      responseSchema,
    },
  };

  let lastError: Error | null = null;

  for (const modelName of MODEL_NAMES) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini API 오류(${response.status}): ${errorText.slice(0, 500)}`);
        if (response.status < 500 && response.status !== 429) break;
        continue;
      }

      const data = await response.json();

      try {
        return parseOutfitsResponse(extractText(data));
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Gemini 응답 파싱 실패');
      }
    }
  }

  throw lastError ?? new Error('Gemini 추천 생성에 실패했습니다.');
};
