import { maskApiKey, requestGeminiOutfits } from '@/lib/gemini';
import { OutfitsResponse, recommendationInputSchema } from '@/lib/schema';
import { NextRequest, NextResponse } from 'next/server';

const buildPreviewImageUrl = (
  input: {
    gender?: string;
    grade?: string;
    heightBody?: string;
    style: string;
    situation: string;
    season: string;
    preferredColors?: string;
  },
  outfit: OutfitsResponse['outfits'][number],
): string => {
  const topItems = outfit.items.slice(0, 4).map((item) => item.name).join(', ');
  const prompt = [
    'realistic Korean student street fashion photo',
    `${input.season} season`,
    `style: ${input.style}`,
    `situation: ${input.situation}`,
    input.gender ? `gender: ${input.gender}` : '',
    input.heightBody ? `body: ${input.heightBody}` : '',
    input.grade ? `grade: ${input.grade}` : '',
    input.preferredColors ? `color palette: ${input.preferredColors}` : '',
    `outfit title: ${outfit.title}`,
    `items: ${topItems}`,
    'natural lighting, full body, high detail, no text, safe for teens',
  ]
    .filter(Boolean)
    .join(', ');

  const seedSource = `${outfit.title}-${outfit.vibe}-${input.style}-${input.situation}`;
  const seed = [...seedSource].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&seed=${seed}&nologo=true`;
};

const buildFallbackImageUrl = (
  input: {
    gender?: string;
    style: string;
    situation: string;
    season: string;
    preferredColors?: string;
  },
  outfit: OutfitsResponse['outfits'][number],
): string => {
  const query = [
    'korean fashion',
    'street style',
    input.season,
    input.style,
    input.situation,
    input.gender,
    input.preferredColors,
    outfit.title,
  ]
    .filter(Boolean)
    .join(',');

  return `https://loremflickr.com/768/1024/${encodeURIComponent(query)}?lock=${encodeURIComponent(outfit.title)}`;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = req.headers.get('x-user-gemini-key')?.trim();
  if (!apiKey) {
    return NextResponse.json({ message: 'Gemini API Key가 필요합니다.' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const input = recommendationInputSchema.parse(json);
    const outfits = await requestGeminiOutfits(apiKey, input);
    const enriched = {
      outfits: outfits.outfits.map((outfit) => ({
        ...outfit,
        previewImageUrl: outfit.previewImageUrl ?? buildPreviewImageUrl(input, outfit),
        previewImageFallbackUrl:
          outfit.previewImageFallbackUrl ?? buildFallbackImageUrl(input, outfit),
      })),
    };
    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[generate-outfits]', {
      apiKey: maskApiKey(apiKey),
      message,
    });

    const status = message.includes('오류(4') ? 400 : 500;
    return NextResponse.json(
      {
        message:
          status === 400
            ? '요청이 올바르지 않거나 API Key/쿼터를 확인해주세요.'
            : '추천 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status },
    );
  }
}
