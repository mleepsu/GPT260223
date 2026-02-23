import { OutfitsResponse } from '@/lib/schema';

const KEY_STORAGE = 'gemini_api_key';
const KEY_SAVE_TOGGLE = 'save_api_key';
const KEY_FAVORITES = 'favorite_outfits';

export const getSaveKeyToggle = (): boolean => localStorage.getItem(KEY_SAVE_TOGGLE) !== 'off';

export const setSaveKeyToggle = (enabled: boolean): void => {
  localStorage.setItem(KEY_SAVE_TOGGLE, enabled ? 'on' : 'off');
  if (!enabled) {
    localStorage.removeItem(KEY_STORAGE);
  }
};

export const getApiKey = (): string => localStorage.getItem(KEY_STORAGE) ?? '';

export const setApiKey = (value: string): void => {
  if (getSaveKeyToggle()) {
    localStorage.setItem(KEY_STORAGE, value);
  }
};

export const getFavorites = (): OutfitsResponse['outfits'] => {
  const raw = localStorage.getItem(KEY_FAVORITES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const setFavorites = (outfits: OutfitsResponse['outfits']): void => {
  localStorage.setItem(KEY_FAVORITES, JSON.stringify(outfits));
};

export const maskKey = (key: string): string => {
  if (key.length < 9) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};
