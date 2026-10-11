import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const item = z.object({ title: z.string(), text: z.string() });

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    // Small uppercase line above the page title.
    eyebrow: z.string().optional(),
    subtitle: z.string().optional(),
    // Short text for the treatment rows on the home page.
    summary: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),

    // Treatments show up on the home page, in the menu order and in the price list.
    isTreatment: z.boolean().default(false),
    order: z.number().default(99),
    duration: z.string().optional(),
    durationLong: z.string().optional(),
    price: z.string().optional(),

    // Optional blocks on a treatment page, shown after the main text in this order.
    principlesIntro: z.string().optional(),
    principles: z.array(item).default([]),
    stepsTitle: z.string().optional(),
    stepsIntro: z.string().optional(),
    stepsNumbered: z.boolean().default(false),
    steps: z.array(item).default([]),
    complaintsTitle: z.string().optional(),
    complaintsIntro: z.string().optional(),
    complaints: z.array(z.string()).default([]),
    factors: z.array(z.string()).default([]),
    factorsCenter: z.string().optional(),
    closing: z.string().optional(),
    note: z.string().optional(),
    showPreparation: z.boolean().default(false),
    showReviews: z.boolean().default(false),

    // "Wie ben ik?" page
    quote: z.string().optional(),
    facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  }),
});

export const collections = { pages };
