import { z } from 'zod';

export const ITEM_CATEGORIES = [
  'TOP',
  'BOTTOM',
  'OUTER',
  'SHOES',
  'BAG',
  'ACCESSORY',
] as const;

export const recommendationInputSchema = z.object({
  gender: z.string().max(20).optional().default(''),
  grade: z.string().max(20).optional().default(''),
  heightBody: z.string().max(40).optional().default(''),
  style: z.string().min(1),
  situation: z.string().min(1),
  season: z.string().min(1),
  preferredColors: z.string().max(100).optional().default(''),
  budgetKRWMax: z.number().int().positive(),
  uniformLayering: z.boolean().optional().default(false),
  ownedItems: z.string().max(200).optional().default(''),
});

const alternativeSchema = z.object({
  name: z.string(),
  keywords: z.array(z.string()).min(1),
  priceKRWMin: z.number().int().nonnegative(),
  priceKRWMax: z.number().int().nonnegative(),
});

const itemSchema = z.object({
  category: z.enum(ITEM_CATEGORIES),
  name: z.string(),
  keywords: z.array(z.string()).min(1),
  priceKRWMin: z.number().int().nonnegative(),
  priceKRWMax: z.number().int().nonnegative(),
  why: z.string(),
  alternatives: z.array(alternativeSchema).default([]),
});

const outfitSchema = z.object({
  title: z.string(),
  vibe: z.string(),
  season: z.string(),
  situation: z.string(),
  items: z.array(itemSchema).min(1),
  totalPriceKRWMin: z.number().int().nonnegative(),
  totalPriceKRWMax: z.number().int().nonnegative(),
  tips: z.array(z.string()).min(1),
});

export const outfitsResponseSchema = z.object({
  outfits: z.array(outfitSchema).min(1).max(5),
});

export type RecommendationInput = z.infer<typeof recommendationInputSchema>;
export type OutfitsResponse = z.infer<typeof outfitsResponseSchema>;
