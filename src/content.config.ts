import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    // Short text for the cards on the home page (treatments only).
    summary: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // Treatments show up on the home page and in the price list.
    isTreatment: z.boolean().default(false),
    order: z.number().default(99),
    duration: z.string().optional(),
    price: z.string().optional(),
    showBookingButton: z.boolean().default(false),
  }),
});

export const collections = { pages };
