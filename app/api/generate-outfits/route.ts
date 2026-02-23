import { maskApiKey, requestGeminiOutfits } from '@/lib/gemini';
import { recommendationInputSchema } from '@/lib/schema';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = req.headers.get('x-user-gemini-key')?.trim();
  if (!apiKey) {
    return NextResponse.json({ message: 'Gemini API Key가 필요합니다.' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const input = recommendationInputSchema.parse(json);
    const outfits = await requestGeminiOutfits(apiKey, input);
    return NextResponse.json(outfits, { status: 200 });
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
