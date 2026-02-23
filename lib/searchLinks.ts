const providers = {
  naver: 'https://search.shopping.naver.com/search/all?query=',
  coupang: 'https://www.coupang.com/np/search?q=',
  musinsa: 'https://www.musinsa.com/search/musinsa/integration?q=',
} as const;

export type Provider = keyof typeof providers;

export const createSearchUrl = (provider: Provider, keywords: string[]): string => {
  const query = keywords.join(' ').trim();
  return `${providers[provider]}${encodeURIComponent(query)}`;
};
