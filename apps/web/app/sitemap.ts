import type { MetadataRoute } from 'next';
import { SIGNS, POINTS, ASPECT_TYPES } from '@starcharts/astro-core';
import { allAspectSlugs, kebab } from '../lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://starcharts.me';
  return [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/aspects`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/signs`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/planets`, changeFrequency: 'monthly', priority: 0.8 },
    ...Object.keys(ASPECT_TYPES).map((t) => ({
      url: `${base}/aspects/${t}`, changeFrequency: 'monthly' as const, priority: 0.7,
    })),
    ...allAspectSlugs().map((slug) => ({
      url: `${base}/aspects/${slug}`, changeFrequency: 'weekly' as const, priority: 0.6,
    })),
    ...SIGNS.map((s) => ({
      url: `${base}/signs/${s.toLowerCase()}`, changeFrequency: 'daily' as const, priority: 0.7,
    })),
    ...POINTS.map((p) => ({
      url: `${base}/planets/${kebab(p)}`, changeFrequency: 'daily' as const, priority: 0.7,
    })),
  ];
}
